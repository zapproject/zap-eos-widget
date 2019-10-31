import { Injectable } from '@angular/core';
import { SharedModule } from './shared.module';
import { Observable, from, merge, interval, of, Subject, BehaviorSubject, forkJoin } from 'rxjs';
import { map, switchMap, filter, share, distinctUntilChanged, take, tap, concat } from 'rxjs/operators';
import {ProdNode as Node } from './eos-utils';
import { Subscriber } from '@zapjs/eos-subscriber';
import hdkey from 'hdkey';
import wif from 'wif';
import bip39 from 'bip39';

declare const Buffer;

//defy drop deny glide insane scene science original sheriff steel case muscle
const network = 'https://api.jungle.alohaeos.com';
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
  public isAllowed$: BehaviorSubject<boolean>;
  public widgetType: {[key: string]: string} | any;
  public token$: BehaviorSubject<{[key: string]: string} | any>;
  public triggerUpdate$ = new Subject<string | void>();
  private login: HTMLElement;
  public balance$: Observable<any>;
  public tokenBalance$: Observable<any>;
  public dotsIssued$: Observable<any>;
  public netid$;
  public widgetList: any;


  constructor() {
    const trigger$ = this.triggerUpdate$.asObservable();
    this.subscriber$ = new BehaviorSubject(null);
    this.isAllowed$ = new BehaviorSubject(false);
    this.widgetType = [];
    this.token$ = new BehaviorSubject({});
    this.balance$ = new Observable();
    this.dotsIssued$ = new Observable();
    this.widgetList = {};
    
    this.tokenBalance$ = new Observable();
    const interval$ = merge(trigger$, of(1), interval(60000)).pipe(share());
    this.hideLogin = this.hideLogin.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this.node = new Node('5KhYksBVQurtLcuCLfjtweY4AmHKTS62bU9D3drjr8kffaQHB4x', false, network);
    this.netid$ = of(1);

    this.balance$ = interval$.pipe(
      switchMap(() => this.subscriber$),
      switchMap((subscriber: Subscriber) => subscriber ? from(this.node.getZapBalance(subscriber)) : of(null)),
    )

    this.dotsIssued$ = interval$.pipe(
      switchMap(() => {
        return (this.widgetList !== {}) ? from(this.node.getIssuedDots(this.widgetList)) : of([]);
      }),
    )

    this.tokenBalance$ = interval$.pipe(
      switchMap(() => this.subscriber$),
      switchMap(subscriber => (subscriber && this.token$.value !== {})  ? from(this.node.getTokenBalance(subscriber, this.token$.value)) : of([])),
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

  async initiate(provider, endpoint) {
    const tokens = await this.node.getProviderTokens(provider, 0, -1, -1);
    this.widgetType[`${provider}&${endpoint}`] = tokens.length ? 'TOKEN' : 'PROVIDER';
    const endpointToken = tokens.filter((tok) => tok.endpoint === endpoint);
    this.token$.next({...this.token$.value, [`${provider}&${endpoint}`]: endpointToken.length ? endpointToken[0].supply : null});
    this.widgetList = {...this.widgetList, [provider]: (this.widgetList[provider] && this.widgetList[provider].length) 
      ? [...this.widgetList[provider], endpoint] : [endpoint]};
    this.triggerUpdate$.next(`${provider}&${endpoint}`);
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
      })
    );  
  }

  handlePermission(): Observable<{result: any; error: any}> {
    return this.subscriber$.pipe(
      filter((subscriber) => !!subscriber && subscriber instanceof Subscriber),
      switchMap((subscriber) => subscriber.handlePermission('zapcoretest4', this.isAllowed$.value ? 'remove' : 'add')
        .then(result => {
          this.isAllowed$.next(!this.isAllowed$.value);
          return {result, error: null};
        })
        .catch(error => ({error, result: null}))
      ))
  }

  bond(provider: string, endpoint: string, dots): Observable<{result: any; error: any}> {
    return this.subscriber$.pipe(
      filter((subscriber) => !!subscriber && subscriber instanceof Subscriber),
      switchMap((subscriber) => this.widgetType[provider + '&' + endpoint] === 'PROVIDER' ? subscriber.bond(provider, endpoint, dots)
        .then(result => ({result, error: null}))
        .catch(error => ({error, result: null})) :
        this.node.tokenBond(subscriber, provider, endpoint, dots)
        .then(result => ({result, error: null}))
        .catch(error => ({error, result: null})))
      )
  }

  unbond(provider: string, endpoint: string, dots): Observable<{result: any; error: any}> {
    return this.subscriber$.pipe(
      filter((subscriber: Subscriber) => !!subscriber && subscriber instanceof Subscriber),
      switchMap((subscriber: Subscriber) =>  this.widgetType[provider + '&' + endpoint] === 'PROVIDER' ? subscriber.unbond(provider, endpoint, dots)
        .then(result => ({result, error: null}))
        .catch(error => ({error, result: null})) :
        this.node.tokenUnBond(subscriber, provider, endpoint, dots)
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
      this.subscriber$.next(subscriber.subscriber);
      this.isAllowed$.next(subscriber.isAllowed);
      this.triggerUpdate$.next();
    })
  }

}
