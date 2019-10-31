import { Component, OnInit, ViewEncapsulation, Input, OnChanges } from '@angular/core';

@Component({
  templateUrl: './zap-user-info.component.html',
  styleUrls: ['./zap-user-info.component.css'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ZapUserInfoComponent implements OnInit {

  @Input() address: any;
  @Input() zap: any;
  @Input() tokbalance: any;

  constructor() { }

  ngOnInit() {
  }

}
