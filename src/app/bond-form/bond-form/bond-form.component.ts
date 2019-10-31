import {
  Component,
  OnInit,
  ViewEncapsulation,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  Input,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { Curve } from '@zapjs/curve';

@Component({
  templateUrl: './bond-form.component.html',
  styleUrls: ['./bond-form.component.css'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BondFormComponent implements OnChanges, AfterViewInit {

  @Input() curvevalues: string;
  @Input() dotsissued: string;
  @Input() allowance: string;
  @Input() bounddots: string;
  @Input() loading: any;
  @Input() tokbalance: string;

  @Output() unbond = new EventEmitter<number>();
  @Output() approve = new EventEmitter<number>();
  @Output() bond = new EventEmitter<number>();
  @Output() showLogin = new EventEmitter<void>();

  @ViewChild('input') input: ElementRef<HTMLInputElement>;

  private curve: Curve;
  private boundedDots: number;
  private dotsIssued: number;

  private dots = 0;

  canUnbond = true;
  loggedIn = false;
  zapRequired = 0;

  constructor(private cd: ChangeDetectorRef) { }

  ngAfterViewInit() {
    this.updateValues();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.curvevalues && changes.curvevalues.currentValue !== changes.curvevalues.previousValue) {
      this.curve = new Curve(JSON.parse(changes.curvevalues.currentValue));
      this.updateValues();
    }

    if (changes.bounddots && changes.bounddots.currentValue !== changes.bounddots.previousValue) {
      this.loggedIn = !!this.bounddots || this.bounddots === '0';
      this.boundedDots = Number(changes.bounddots.currentValue);
      this.dots = Number(this.input.nativeElement.value);
      this.canUnbond = this.boundedDots > this.dots && !this.tokbalance
    }

    if (changes.tokbalance && changes.tokbalance.currentValue !== changes.tokbalance.previousValue) {
      this.canUnbond = this.tokbalance && parseInt(this.tokbalance) > 0;
    }

    if (changes.dotsissued && changes.dotsissued.currentValue !== changes.dotsissued.previousValue) {
      this.dotsIssued = Number(changes.dotsissued.currentValue) || 1;
    }
  }

  get max() {
    return this.curve ? this.curve.max - this.dotsIssued : 100;
  }

  private updateValues() {
    this.dots = Number(this.input.nativeElement.value);
    if (!this.curve) return;
    this.canUnbond = (this.boundedDots >= this.dots && !this.tokbalance) || (parseInt(this.tokbalance) >= this.dots);
    try {
      this.zapRequired = this.curve.getZapRequired(this.dotsIssued, this.dots);
      this.cd.detectChanges();
    } catch (e) {
      console.log(e);
      this.input.nativeElement.value = this.max.toString();
      this.zapRequired = this.curve.getZapRequired(this.dotsIssued, this.max);
      this.cd.detectChanges();
    }
  }

  handleDotsChange() {
    this.updateValues();
  }

  handleUnbond() {
    if (this.dots < 1 || (this.dots > this.boundedDots && !this.tokbalance) || parseInt(this.tokbalance) === 0) return;
    this.unbond.emit(this.dots);
  }


  handleSubmit(e) {
    e.preventDefault();
    if (this.dots > 0) {
      this.bond.emit(this.dots);
    }
  }

}
