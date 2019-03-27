import { Injectable } from '@angular/core';
import { SharedModule } from './shared.module';
import { Observable, from, merge, interval, of, Subject, BehaviorSubject } from 'rxjs';
import { map, shareReplay, switchMap, filter, share, distinctUntilChanged, take } from 'rxjs/operators';
import {ProdNode as Node } from './eos-utils';
import { Subscriber } from '@zapjs/eos-subscriber';
import { Provider } from '@zapjs/eos-provider';
import BigNumber from 'big-number';
import ecc from 'eosjs-ecc';
import hdkey from 'hdkey';
import wif from 'wif';
import bip39 from 'bip39';

declare const Buffer;

//brave foil add horn welcome ancient squirrel fury build document panic rural
const network = 'http://127.0.0.1:8888';
interface AppWindow extends Window {
  web3: any;
  ethereum: any;
}
declare const window: AppWindow;

@Injectable({
  providedIn: SharedModule
})
export class ZapService {
  private node: Node;
  public subscriber$: BehaviorSubject<Subscriber | null>;
  private triggerUpdate$ = new Subject<void>();
  private login: HTMLElement;
  public balance$: Observable<any>;
  public netid$;


  constructor() {
    const trigger$ = this.triggerUpdate$.asObservable();
    this.subscriber$ = new BehaviorSubject(null);
    this.balance$ = new Observable();
    const interval$ = merge(trigger$, of(1), interval(5000)).pipe(share());
    this.hideLogin = this.hideLogin.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this.node = new Node('', false, network);

    this.netid$ = of(1);


    this.balance$ = interval$.pipe(
      switchMap(() => this.subscriber$),
      switchMap((subscriber: Subscriber) => subscriber ? from(this.node.getZapBalance(subscriber)) : of(null)),
    )
  }

  getBoundDots(provider, endpoint) {
    const noop$ = this.subscriber$.pipe(filter(subscriber => !subscriber), map(() => null));
    const dots$ = this.subscriber$.pipe(
      filter((subscriber: any) => !!subscriber && subscriber instanceof Subscriber),
      switchMap(subscriber => this.node.getEndpointBound(subscriber, provider, endpoint)),
    );
    return merge(noop$, dots$);
  }


  getWidgetInfo(address: string, endpoint: string) {
    const provider = this.node.loadProvider(address);
    const endp$ =  from(this.node.getProviderEndpointInfo(provider, endpoint));
    return endp$.pipe(
      map((response: any) => {
        const curve: any = {};
        curve.values = response.curveValues;
        curve.max = response.curveMax;
        // curve.curveString = response.curveString;
        const dotsIssued = response.dotsIssued;
        const endpointMd = response.endpointMd;
        const endpointJson = response.endpointJson;
        return {
          provider,
          curve,
          dotsIssued,
          endpointMd,
          endpointJson,
        }
      }),
    );
  }

  bond(provider: string, endpoint: string, dots): Observable<{result: any; error: any}> {
    return this.subscriber$.pipe(
      filter((subscriber: Subscriber) => !!subscriber && subscriber instanceof Subscriber),
      switchMap(subscriber => subscriber.bond(provider, endpoint, dots)
        .then(result => ({result, error: null}))
        .catch(error => ({error, result: null})))
      )
  }

  unbond(provider: string, endpoint: string, dots): Observable<{result: any; error: any}> {
    return this.subscriber$.pipe(
      filter((subscriber: Subscriber) => !!subscriber && subscriber instanceof Subscriber),
      switchMap((subscriber: Subscriber) => subscriber.unbond(provider, endpoint, dots)
        .then(result => ({result, error: null}))
        .catch(error => ({error, result: null})))
      )
  }



  showLogin() {
    this.login = document.body.appendChild(document.createElement('zap-login'));
    this.login.addEventListener('login', this.handleLogin);
    this.login.addEventListener('close', this.hideLogin);
  }

  hideLogin() {
    this.login.removeEventListener('login', this.handleLogin);
    this.login.removeEventListener('close', this.hideLogin);
    this.login.parentElement.removeChild(this.login);
    this.login = null;
  }

  handleLogin(event: CustomEvent) {
    const { mnemonic, network } = event.detail;
    const seed = bip39.mnemonicToSeedHex(mnemonic)
		const master = hdkey.fromMasterSeed(new Buffer(seed, 'hex'))
		const nodem = master.derive("m/44'/194'/0'/0/0")
		const key = wif.encode(128, nodem._privateKey, false);
    this.node = new Node(key, false, network);
    this.node.loadSubscriber().then(subscriber => {
      if (subscriber) this.hideLogin();
      this.subscriber$.next(subscriber);
      this.triggerUpdate$.next();
    })
  }


}
