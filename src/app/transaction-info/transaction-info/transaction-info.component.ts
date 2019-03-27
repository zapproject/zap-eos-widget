import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';

@Component({
  templateUrl: './transaction-info.component.html',
  styleUrls: ['./transaction-info.component.css'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TransactionInfoComponent implements OnInit {

  @Input() netid;
  @Input() tx;

  constructor() { }

  ngOnInit() {
  }

  getTransaction(e) {
    e.preventDefault();
    /*const data = `{"id": ${'3eab71a1e655394028dd50c26db596f99bd4409dd71e64e67a51e00eca2e885d'}}`;
    const xhr = new XMLHttpRequest();

    xhr.addEventListener('readystatechange', function() {
      if (this.readyState === this.DONE) {
        console.log(this.responseText);
      }
    });

    xhr.open('POST', 'http://127.0.0.1:8888/v1/history/get_transaction');
    xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded; charset=UTF-8');

    xhr.send(data);*/
  }


  get href() {
    return 'http://127.0.1.1:8888/' + this.tx;
  }
}
