import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { DRY_CONVERSIONS } from 'src/app/constants/constants';
import { DryConversion } from 'src/app/models/dry-conversion.model';
import { fractionPart, wholePart } from 'src/app/utils/measure.util';

@Component({
  selector: 'app-dry-conversion',
  templateUrl: './dry-conversion.component.html',
  styleUrls: ['./dry-conversion.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class DryConversionComponent {
  dataSource = new MatTableDataSource<DryConversion>(DRY_CONVERSIONS);
  displayColumns: string[] = ['cups', 'tablespoons', 'teaspoons', 'grams'];

  whole = wholePart;
  fraction = fractionPart;
}
