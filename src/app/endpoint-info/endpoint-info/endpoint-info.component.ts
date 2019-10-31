import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';

@Component({
  templateUrl: './endpoint-info.component.html',
  styleUrls: ['./endpoint-info.component.css'],
  encapsulation: ViewEncapsulation.Emulated
})
export class EndpointInfoComponent implements OnInit {

  @Input() title: string;
  @Input() endpoint: string;
  @Input() dotsissued: string;
  @Input() bounddots: string;
  @Input() token: string;

  constructor() { }

  ngOnInit() {
  }

}
