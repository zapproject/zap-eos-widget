import {Account, Node, Transaction } from '@zapjs/eos-utils';
import { Subscriber } from "@zapjs/eos-subscriber";
import { Provider } from "@zapjs/eos-provider";
import BigNumber from 'bignumber.js';
import ecc from 'eosjs-ecc';
import { Serialize, Numeric } from 'eosjs';


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
			chain_id: '',
			contract: 'zapcoretest4'
		});
		this.ACC_USER_PRIV_KEY = privateKey;
	}

	public loadProvider(name: any) {
		const node = this;
  		if(!name) return null;
			const providerAcc = new Account(name);
			const provider: Provider = new Provider({
			account: providerAcc,
			node
		});
		return provider;
	}

	public async loadSubscriber(_name?: any) {
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
		return this.rpc.get_currency_balance("eosio.token", subscriber.getAccount().name, 'EOS')
	}

	async getTokenBalance(subscriber: Subscriber, token: string) {
		if(!subscriber || !token) {
			return Promise.resolve(null)
		}
		const tokens = await this.getSubscriberTokens(subscriber.getAccount().name, 0, -1, -1);
		return tokens.filter(ret => ret.balance && ret.balance.split(' ')[1] === token)[0].balance;
	}

	public async loadAccount() {
		const node = this;
		const accounts = await this.rpc.history_get_key_accounts(ecc.privateToPublic(this.ACC_USER_PRIV_KEY));
		console.log(ecc.privateToPublic(this.ACC_USER_PRIV_KEY))
		return accounts.account_names[0];
	}

	public async getEndpointBound(subscriber: Subscriber, provider: string, endpoint: string) {
		const encodedName = new BigNumber(this.getEncodedName(provider));
		// @ts-ignore
    	const allHolders = await subscriber.queryHolders(encodedName.toString(), encodedName.plus(1).toString(), -1);
    	const _bound = allHolders.rows.filter((raw: any) => raw.endpoint === endpoint);
    	const bound = (_bound.length) ? _bound[0].dots : 0;
    	return bound;
  	}

  	public async getFile(url) {
    	const response = await fetch(url);
    	const text = await response.text();
	}
	  
	public async getIssuedDots(provider: Provider, endpoint: string) {
		const endps = await provider.queryProviderEndpoints(0, -1, -1);
		const endp = endps.rows.filter((x: any, i: any) => x.specifier === endpoint);
		const dotsIssued = await provider.queryIssued(endp[0].id, endp[0].id + 1, 1);
		return (dotsIssued.rows.length) ? dotsIssued.rows[0].dots : 0;
	}

	public async getProviderEndpointInfo(provider: Provider, endpoint: string) {
		const response: any = {};
		const endps = await provider.queryProviderEndpoints(0, -1, -1);
		const endp = endps.rows.filter((x: any, i: any) => x.specifier === endpoint);
		response.curveValues = endp[0].functions;
    	const provInf = await provider.queryProviderList(0, -1, -1);
    	response.title  = provInf.rows[0].title;
    	const _params = await provider.queryParams(0, -1, -1, 2);
    	const params = _params.rows.filter(x => x.endpoint === '');
    	if (!params.length) return response;
    	response.endpointMd = await this.getFile(JSON.parse(params[0]['values'][0])[endpoint + '.md']);
    	response.endpointJson = await this.getFile(JSON.parse(params[0]['values'][0])[endpoint + '.json']);
		return response;
	}

	public getEncodedName(name: string) {
		const buffer: Serialize.SerialBuffer = new Serialize.SerialBuffer();
		buffer.pushName(name);
		return Numeric.binaryToDecimal(buffer.getUint8Array(8));
	}

	public async getProviderTokens(provider, lower_bound, upper_bound, limit) {
        const {rows} = await this.rpc.get_table_rows({
                json: true,
                code: this.getZapAccount().name,
                scope: provider,
                table: 'ftoken',
                lower_bound: 0,
                upper_bound: -1,
                limit: -1,
                key_type: 'i64',
                index_position: 1
		});
    	return rows;
	}

	public async getSubscriberTokens(subscriber: string, lower_bound: number, upper_bound: number, limit: number) {
		const {rows} = await this.rpc.get_table_rows({
		  json: true,
		  code: this.getZapAccount().name,
		  scope: subscriber,
		  table: 'accounts',
		  lower_bound,
		  upper_bound,
		  limit,
		  key_type: 'i64',
		  index_position: 1
		});
		return rows;
	}

	public async tokenBond(subscriber: Subscriber, provider: string, specifier: string, dots: number) {
        return await new Transaction( )
        .sender(subscriber.getAccount())
        .receiver(subscriber.getNode().getZapAccount())
        .action('tdbond')
        .data({issuer: subscriber.getAccount().name, provider, specifier, dots})
        .execute(subscriber.getNode().api)
    }
    public async tokenUnBond(subscriber: Subscriber, provider: string, specifier: string, dots: number) {
      return await new Transaction( )
        .sender(subscriber.getAccount())
        .receiver(subscriber.getNode().getZapAccount())
        .action('tdunbond')
        .data({issuer: subscriber.getAccount().name, provider, specifier, dots})
        .execute(subscriber.getNode().api)
    }
}


