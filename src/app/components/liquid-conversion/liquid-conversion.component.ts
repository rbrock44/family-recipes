import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { LIQUID_CONVERSIONS } from 'src/app/constants/constants';
import { LiquidConversion } from 'src/app/models/liquid-conversion.model';
import { fractionPart, wholePart } from 'src/app/utils/measure.util';

@Component({
  selector: 'app-liquid-conversion',
  templateUrl: './liquid-conversion.component.html',
  styleUrls: ['./liquid-conversion.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class LiquidConversionComponent {
  dataSource = new MatTableDataSource<LiquidConversion>(LIQUID_CONVERSIONS);
  displayColumns: string[] = ['gallons', 'quarts', 'pints', 'cups'];

  whole = wholePart;
  fraction = fractionPart;
}
