import {Account, Node } from '@zapjs/eos-utils';
import { Subscriber } from "@zapjs/eos-subscriber";
import { Provider } from "@zapjs/eos-provider";
import { curveString } from './Curve';
import BigNumber from 'big-number';
import ecc from 'eosjs-ecc';


export class ProdNode extends Node {
	ACC_USER_PRIV_KEY: string;
	addressesPromise: Promise<any>;
  providersPromise: Promise<any>;
  ProvEndpPromise: Promise<any>;
  lastTaken: Array<string> = [];
	connect: any;

	constructor(privateKey: string, verbose: boolean, endpoint: string) {

		super({
			verbose: verbose,
			key_provider: [privateKey],
			http_endpoint: endpoint,
			chain_id: ''
		});
		this.ACC_USER_PRIV_KEY = privateKey;
	}

	loadProvider(name: any) {
		const node = this;
  	if(!name) return null;
		const providerAcc = new Account(name);
		const provider: Provider = new Provider({
		account: providerAcc,
		node
		});
		return provider;
	}

	async loadSubscriber(_name?: any) {
		const node = this;
		const name = (_name) ? _name : await this.loadAccount();
  	if(!name) return null;
		const subscriberAcc = new Account(name);
		subscriberAcc.usePrivateKey(this.ACC_USER_PRIV_KEY);
		const subscriber: Subscriber = new Subscriber({
			account: subscriberAcc,
			node
		});
		return subscriber;
	}

	getZapBalance(subscriber: Subscriber) {
		return this.connect().then(eos => eos.getCurrencyBalance('zap.token', subscriber.getAccount().name, 'TST'));
	}

	async loadAccount() {
		const node = this;
		const eos = await node.connect();
		const accounts = await eos.getKeyAccounts({public_key: ecc.privateToPublic(this.ACC_USER_PRIV_KEY)});
		return accounts.account_names[0];
	}

	async getEndpointBound(subscriber: Subscriber, provider: string, endpoint: string) {
    const eos = await subscriber.getNode().connect();
    const encodedName = new BigNumber(eos.modules.format.encodeName(provider, false));
    const allHolders = await subscriber.queryHolders(encodedName.toString(), encodedName.plus(1).toString(), -1);
    const _bound = allHolders.rows.filter((raw: any) => raw.endpoint === endpoint);
    const bound = (_bound.length) ? _bound[0].dots : 0;
    return bound;
  }

  async getFile(url) {
    const response = await fetch(url);
    const text = await response.text();
  }

	async getProviderEndpointInfo(provider: Provider, endpoint: string) {
		const response: any = {};
		const endps = await provider.queryProviderEndpoints(0, -1, -1);
		const endp = endps.rows.filter((x: any, i: any) => x.specifier === endpoint);
		response.curveValues = endp[0].functions;
		response.curveString = curveString(endp[0].functions);
    response.curveMax = endp[0].functions[endp[0].functions.length - 1];
		const eos = await provider.getNode().connect();
		const encodedName = new BigNumber(eos.modules.format.encodeName(provider.getAccount().name, false));
    const provInf = await provider.queryProviderList(0, -1, -1);
    response.title  = provInf.rows[0].title;
		const dotsIssued = await provider.queryIssued(endp[0].id, endp[0].id + 1, 1);
		response.dotsIssued = (dotsIssued.rows.length) ? dotsIssued.rows[0].dots : 0;
    const _params = await provider.queryParams(0, -1, -1, 2);
    const params = _params.rows.filter(x => x.endpoint === '');
    if (!params.length) return response;
    response.endpointMd = await this.getFile(JSON.parse(params[0]['values'][0])[endpoint + '.md']);
    response.endpointJson = await this.getFile(JSON.parse(params[0]['values'][0])[endpoint + '.json']);
		return response;
	}
}
