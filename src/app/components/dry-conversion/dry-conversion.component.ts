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
import { DRY_CONVERSIONS } from 'src/app/constants/constants';
import { DryConversion } from 'src/app/models/dry-conversion.model';
import { fractionPart, wholePart } from 'src/app/utils/measure.util';
import { FractionComponent } from '../fraction/fraction.component';

@Component({
  selector: 'app-dry-conversion',
  templateUrl: './dry-conversion.component.html',
  styleUrls: ['./dry-conversion.component.scss'],
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
export class DryConversionComponent {
  dataSource = new MatTableDataSource<DryConversion>(DRY_CONVERSIONS);
  displayColumns: string[] = ['cups', 'tablespoons', 'teaspoons', 'grams'];

  whole = wholePart;
  fraction = fractionPart;
}
