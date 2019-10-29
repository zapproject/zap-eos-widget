import { Component, OnInit, ViewEncapsulation, Input, ChangeDetectorRef } from '@angular/core';

@Component({
  templateUrl: './transaction-info.component.html',
  styleUrls: ['./transaction-info.component.css'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TransactionInfoComponent implements OnInit {

  @Input() netid;
  @Input() tx;
  txInfo;

  constructor(private cd: ChangeDetectorRef) { }

  ngOnInit() {
  }

  getTransaction(e, tx: string) {
    e.preventDefault();
    const component = this;
    if(component.txInfo) {
      component.txInfo = '';
      component.cd.detectChanges();
      return;
    }
    const data = `{"id": "${tx}"}`;
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', function() {
      if (this.readyState === this.DONE) {
        component.txInfo = this.responseText;
        component.cd.detectChanges();
      }
    });

    xhr.open('POST', 'https://api.jungle.alohaeos.com/v1/history/get_transaction');
    xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded; charset=UTF-8');

    xhr.send(data);
  }


  get href() {
    return '#';
  }
}
