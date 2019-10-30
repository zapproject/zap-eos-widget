import { Component, ViewEncapsulation, Input, OnChanges, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { ZapService } from 'src/app/shared/zap.service';
import { filter, take, switchMap, share, map, shareReplay, tap } from 'rxjs/operators';
import { Subject, merge, of, Observable } from 'rxjs';

@Component({
  templateUrl: './bond-widget.component.html',
  styleUrls: ['./bond-widget.component.css'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BondWidgetComponent implements OnInit, OnChanges, OnDestroy {

  @Input() address: string;
  @Input() endpoint: string;

  curveValuesStringified: string;
  title;
  token: string;
  dotsIssued: any;
  zapBalance: any;
  tokBalance: any;
  dotsBound: any;
  accountAddress: any;
  private action = new Subject<{type: 'BOND' | 'UNBOND' | 'APPROVE', payload: number}>();
  private change = new Subject<void>();
  change$ = this.change.asObservable().pipe(shareReplay(1));

  loading$: Observable<boolean>;
  endpointMd: string;

  subscriptions = [];

  message: {type?: 'ERROR' | 'SUCCESS'; text: string, tx?: any} = null;

  netid;

  constructor(
    public zap: ZapService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const change$ = merge(this.change$, of(1));
    this.zap.initiate(this.address, this.endpoint);

    this.subscriptions.push(this.zap.netid$.subscribe(netid => { this.netid = netid; }))

    this.subscriptions.push(this.zap.subscriber$.subscribe((subscriber: any) => {
      this.accountAddress = subscriber ? subscriber.getAccount().name : '';
      this.cd.detectChanges();
    }));

    this.subscriptions.push(change$.pipe(switchMap(e => this.zap.getBoundDots(this.address, this.endpoint))).subscribe(dots => {
      this.dotsBound = dots;
      this.cd.detectChanges();
    }));


    this.subscriptions.push(this.zap.balance$.subscribe(zap => {
      this.zapBalance = zap;
      this.cd.detectChanges();
    }));

    this.subscriptions.push(this.zap.dotsIssued$.subscribe(dots => {
      this.dotsIssued = dots[`${this.address}&${this.endpoint}`];
      this.cd.detectChanges();
    }));

    this.subscriptions.push(this.zap.tokenBalance$.subscribe(tok => {
      console.log(tok)
      this.tokBalance = tok[`${this.address}&${this.endpoint}`];
      this.cd.detectChanges();
    }));

    this.subscriptions.push(this.zap.token$.subscribe(tok => {
      this.token = tok[`${this.address}&${this.endpoint}`] ? tok[`${this.address}&${this.endpoint}`].split(' ')[1] : null;
      this.cd.detectChanges();
    }));

    const action$ = this.action.asObservable().pipe(
      share(),
    );
    const bond$ = action$.pipe(
      filter(({type}) => type === 'BOND'),
      tap(() => { this.handleMessage({text: 'Bonding...'}); }),
      switchMap(({payload}) => this.zap.bond(this.address, this.endpoint, payload)),
      share(),
    );
    const unbond$ = action$.pipe(
      filter(({type}) => type === 'UNBOND'),
      tap(() => { this.handleMessage({text: 'Unbonding...'}); }),
      switchMap(({payload}) => this.zap.unbond(this.address, this.endpoint, payload)),
      share(),
    );

    const error$ = merge(bond$, unbond$).pipe(
      filter(response => !!response.error),
      map(({error}) => error),
      tap(error => {
        this.handleMessage({text: error.message, type: 'ERROR'});
      }),
    );
    const success$ = merge(bond$, unbond$).pipe(
      filter(response => !response.error),
      map(({result}) => result),
      tap((result) => {
        console.log('result', result);
        this.change.next();
        this.zap.triggerUpdate$.next(`${this.address}&${this.endpoint}`);
        this.handleMessage({text: 'Done!', type: 'SUCCESS', tx: result.transaction_id});
      }),
    );
    this.loading$ = merge(
      action$.pipe(map(() => true)),
      error$.pipe(map(() => null)),
      success$.pipe(map(() => null)),
    ).pipe(tap(() => {
      setTimeout(() => { this.cd.detectChanges(); });
    }));
  }

  handleMessage(message) {
    this.message = message;
    this.cd.detectChanges();
  }

  ngOnChanges() {
    if (!this.address || !this.endpoint) return;
    this.zap.getWidgetInfo(this.address, this.endpoint).pipe(
      filter(e => !!e),
      take(1),
    ).subscribe(widget => {
      this.curveValuesStringified = JSON.stringify(widget.curve.values);
      this.title = widget.provider.getTitle();
      this.endpointMd = widget.endpointMd;
      this.cd.detectChanges();
    });
    this.change.next();
  }

  ngOnDestroy() {
    this.change.complete();
    this.action.complete();
    this.subscriptions.forEach( e => e.unsubscribe());
  }

  handleBond(e: CustomEvent) {
    this.action.next({type: 'BOND', payload: e.detail});
  }

  handleUnbond(e: CustomEvent) {
    this.action.next({type: 'UNBOND', payload: e.detail});
  }

}
