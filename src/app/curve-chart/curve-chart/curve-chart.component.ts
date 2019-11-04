import { Component, ViewEncapsulation, Input, ViewChild, ElementRef, AfterViewInit, OnChanges } from '@angular/core';
import { CurveSvgLineChart } from 'zap-curve-chart/lib/CurveSvgLineChart';

@Component({
  templateUrl: './curve-chart.component.html',
  styleUrls: ['./curve-chart.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CurveChartComponent implements OnChanges, AfterViewInit {

  @Input() dotsissued: string;
  @Input() curvevalues: string;

  private chart: CurveSvgLineChart;

  @ViewChild('curveChart') curveChartRef: ElementRef<HTMLDivElement>;

  values: number[] = null;
  curveString = '';

  constructor() { }

  ngOnChanges() {
    this.updateChart();
  }

  ngAfterViewInit() {
    this.chart = new CurveSvgLineChart(this.curveChartRef.nativeElement, {
      maxDots: 300,
      height: 150,
      width: this.curveChartRef.nativeElement.parentElement.clientWidth,
    });
    this.updateChart();
  }

  private updateChart() {
    if (!this.curvevalues || !this.chart) return;
    try {
      this.values = JSON.parse(this.curvevalues);
      this.curveString = curveToString(this.values);
      const dotsIssued = Number(this.dotsissued);
      this.chart.draw(this.values, isNaN(dotsIssued) || dotsIssued < 1 ? 1 : dotsIssued);
    } catch (e) {
      console.log('e', e);
    }
  }

}

function curveToString(values) {
  const length = values[0];
  let str = '';
  for (let i = length; i > 0; i--) { // convert each term into string
    const coeff = values[i];
    const pow = i - 1;
    if (coeff === 0) continue;
    if (i !== length) str += ' + ';
    str += coeff;
    if (pow !== 0) {
      str += 'x^' + pow;
    }
  }
  return str;
}
