import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-fraction',
  templateUrl: './fraction.component.html',
  styleUrls: ['./fraction.component.scss']
})
export class FractionComponent {
  @Input() fraction: string = ''
  @Input() before: string = ''
  @Input() after: string = ''

  numerator(value: string): string {
    const index = value.indexOf('/');
    if (index > -1) {
      return value.substring(0, index);
    }
    return value;
  }
  
  denominator(value: string): string {
    const index = value.indexOf('/');
    if (index > -1) {
      return value.substring(index + 1);
    }
    return '';
  }

  removeZero(value: string): string {
    return value == '0' ? '' : value
  }
}
