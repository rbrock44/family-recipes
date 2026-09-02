import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  MatTableDataSource,
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow,
} from '@angular/material/table';
import { LIQUID_CONVERSIONS } from 'src/app/constants/constants';
import { LiquidConversion } from 'src/app/models/liquid-conversion.model';
import { fractionPart, wholePart } from 'src/app/utils/measure.util';
import { FractionComponent } from '../fraction/fraction.component';

@Component({
  selector: 'app-liquid-conversion',
  templateUrl: './liquid-conversion.component.html',
  styleUrls: ['./liquid-conversion.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    FractionComponent,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
  ],
})
export class LiquidConversionComponent {
  dataSource = new MatTableDataSource<LiquidConversion>(LIQUID_CONVERSIONS);
  displayColumns: string[] = ['gallons', 'quarts', 'pints', 'cups'];

  whole = wholePart;
  fraction = fractionPart;
}
