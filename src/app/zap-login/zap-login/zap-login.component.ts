import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';


@Component({
  templateUrl: './zap-login.component.html',
  styleUrls: ['./zap-login.component.css'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ZapLoginComponent implements OnInit {

  @Output() login = new EventEmitter<any>();
  @Output() close = new EventEmitter<any>();

  message = null;

  disabled = false;

  networks = [
    {
      name: 'Test Node',
      url: 'https://api.jungle.alohaeos.com:443'
    }
  ];

  constructor(private cd: ChangeDetectorRef) { }

  ngOnInit() {
  }

  handleLogin(e) {
    e.preventDefault();
    this.message = 'Loggin in...';
    const form = e.target as HTMLFormElement;
    const mnemonic = form.mnemonic.value;
    const network = form.network.value;
    // this.message.message = {type: MESSAGE_TYPE.LOADIG, text: 'Loggin in'};
    this.disabled = true;
    this.cd.detectChanges();
    try {
      this.login.emit({mnemonic, network});
    } catch (e) {
      this.disabled = false;
      // this.message.message = {type: MESSAGE_TYPE.ERROR, text: e.message};
    }
  }
}
