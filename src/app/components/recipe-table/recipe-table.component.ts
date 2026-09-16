import {
  Component,
  EventEmitter,
  Input,
  NgZone,
  Output,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import {
  MatTableDataSource,
  MatTable,
  MatColumnDef,
  MatCellDef,
  MatCell,
  MatRowDef,
  MatRow,
} from '@angular/material/table';
import { AddToListDialogComponent } from '../add-to-list-dialog/add-to-list-dialog.component';
import { getCategory } from 'src/app/models/category.enum';
import { Recipe } from '../../models/recipe.interface';
import { RecipeService } from '../../services/recipe.service';
import { Location, NgClass } from '@angular/common';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import {
  CdkVirtualScrollViewport,
  CdkFixedSizeVirtualScroll,
} from '@angular/cdk/scrolling';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-recipe-table',
  templateUrl: './recipe-table.component.html',
  styleUrls: ['./recipe-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    NgClass,
    MatButton,
    MatSort,
    MatSortHeader,
    MatCheckbox,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    MatTable,
    MatColumnDef,
    MatCellDef,
    MatCell,
    MatIconButton,
    MatIcon,
    MatRowDef,
    MatRow,
  ],
})
export class RecipeTableComponent implements OnInit, OnChanges, OnDestroy {
  @Input() dataSource = new MatTableDataSource<Recipe>();
  @Input() removeColumns: boolean = false;
  @Input() isFavoritesList: boolean = false;
  @Input() showUnfavorite: boolean = false;
  @Input() showFavorite: boolean = false;
  @Input() showRemoveRecent: boolean = false;
  @Input() showAddToList: boolean = false;
  @Input() showBulkActions: boolean = false;
  @Input() showWhenEmpty: boolean = false;
  @Output() favoritesChanged = new EventEmitter<void>();
  displayColumns: string[] = ['name', 'author', 'category', 'filename'];
  readonly actionButtonWidth = 32;
  readonly actionsPadding = 4;
  readonly defaultRowHeight = 48;
  readonly wrappedRowHeight = 64;
  readonly wrapQuery = '(max-width: 550px)';
  readonly wideQuery = '(min-width: 1100px)';
  rowHeight = this.defaultRowHeight;
  isWide = false;
  scrollbarGutter = 0;

  // @ts-ignore
  @ViewChild(MatSort) sort: MatSort;

  @ViewChild('viewport')
  set viewportRef(viewport: CdkVirtualScrollViewport | undefined) {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;

    if (!viewport) {
      return;
    }

    const viewportEl = viewport.elementRef.nativeElement;

    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.run(() => {
        // The viewport is sized off the row count, so it starts at 0px and only
        // grows once recipes load. The cdk measures the viewport on init and
        // then only again on window resize, so without re-measuring here it
        // keeps rendering the few buffer rows that fit the height it first saw.
        viewport.checkViewportSize();

        const gutter = viewportEl.offsetWidth - viewportEl.clientWidth;
        if (gutter !== this.scrollbarGutter) {
          this.scrollbarGutter = gutter;
        }
      });
    });
    this.resizeObserver.observe(viewportEl);
  }

  private resizeObserver?: ResizeObserver;
  private wrapQueryList?: MediaQueryList;
  private wideQueryList?: MediaQueryList;

  private readonly onWideChange = (event: MediaQueryListEvent): void => {
    this.ngZone.run(() => {
      this.isWide = event.matches;
      this.updateDisplayColumns();
    });
  };

  private readonly onWrapChange = (event: MediaQueryListEvent): void => {
    this.ngZone.run(() => {
      this.rowHeight = event.matches
        ? this.wrappedRowHeight
        : this.defaultRowHeight;
    });
  };

  constructor(
    private location: Location,
    public service: RecipeService,
    private dialog: MatDialog,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.dataSource.sort = this.sort;

    this.wrapQueryList = window.matchMedia(this.wrapQuery);
    this.rowHeight = this.wrapQueryList.matches
      ? this.wrappedRowHeight
      : this.defaultRowHeight;
    this.wrapQueryList.addEventListener('change', this.onWrapChange);

    this.wideQueryList = window.matchMedia(this.wideQuery);
    this.isWide = this.wideQueryList.matches;
    this.wideQueryList.addEventListener('change', this.onWideChange);
    this.updateDisplayColumns();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.wrapQueryList?.removeEventListener('change', this.onWrapChange);
    this.wideQueryList?.removeEventListener('change', this.onWideChange);
  }

  ngOnChanges(): void {
    this.updateDisplayColumns();
  }

  showNumber(): boolean {
    return !this.removeColumns || this.isWide;
  }

  private updateDisplayColumns(): void {
    const columns = ['name', 'author'];

    if (!this.removeColumns) {
      columns.push('category');
    }

    if (this.showNumber()) {
      columns.push('filename');
    }

    if (
      this.showUnfavorite ||
      this.showFavorite ||
      this.showRemoveRecent ||
      this.showAddToList
    ) {
      columns.push('actions');
    }

    this.displayColumns = columns;
  }

  click(recipe: Recipe, event?: Event): void {
    if (event && (event.target as HTMLElement).closest('.mat-column-actions')) {
      return;
    }

    // Rows inside cdk-virtual-scroll-viewport are rendered via ngZone.runOutsideAngular,
    // so their (click) listeners fire outside Angular's zone. Without this, the service
    // mutations below happen but no change detection runs, so the view doesn't update
    // until some unrelated event elsewhere happens to trigger a CD tick.
    this.ngZone.run(() => {
      if (this.showAddToList && this.service.selectMode) {
        this.service.toggleSelectedForList(recipe.filename);
        return;
      }

      this.service.useFavoritesList = this.isFavoritesList;
      var filename = recipe.filename != null ? recipe.filename.toString() : '001';
      recipe.filename = filename;
      this.service.searchList = this.dataSource.data.map((item) => item.filename);
      this.service.returnScrollY = window.scrollY;
      this.service.selectRecipe(recipe);
      this.service.addToRecent(filename);
      this.service.openedFromLists = false;
      this.service.activeListId = null;

      this.location.replaceState(this.buildUrl(filename));
    });
  }

  actionsWidth(): string {
    const buttons = [
      this.showUnfavorite,
      this.showFavorite,
      this.showRemoveRecent,
      this.showAddToList,
    ].filter(Boolean).length;

    // + the cell's own right padding, which border-box counts inside the width.
    return `${buttons * this.actionButtonWidth + this.actionsPadding}px`;
  }

  getCategory(categoryNumber: number): string {
    return getCategory(categoryNumber);
  }

  unfavoriteRow(recipe: Recipe, event: Event): void {
    event.stopPropagation();
    this.ngZone.run(() => {
      this.service.removeFromFavorites(recipe.filename);
      this.dataSource.data = this.dataSource.data.filter(
        (it) => it.filename !== recipe.filename,
      );
    });
  }

  isFavorite(recipe: Recipe): boolean {
    return this.service.isFavorite(recipe.filename);
  }

  toggleFavorite(recipe: Recipe, event: Event): void {
    event.stopPropagation();
    this.ngZone.run(() => {
      if (this.service.isFavorite(recipe.filename)) {
        this.service.removeFromFavorites(recipe.filename);
      } else {
        this.service.addToFavorites(recipe.filename);
      }

      this.favoritesChanged.emit();
    });
  }

  removeRecent(recipe: Recipe, event: Event): void {
    event.stopPropagation();
    this.ngZone.run(() => {
      this.service.removeFromRecent(recipe.filename);
      this.dataSource.data = this.dataSource.data.filter(
        (it) => it.filename !== recipe.filename,
      );
    });
  }

  setSelectMode(checked: boolean): void {
    this.service.selectMode = checked;

    if (!checked) {
      this.service.clearSelectedForList();
    }
  }

  openAddToList(recipe: Recipe, event: Event): void {
    event.stopPropagation();
    this.dialog.open(AddToListDialogComponent, {
      data: { recipes: [recipe], defaultBatches: 1 },
    });
  }

  openBulkAddToList(): void {
    // Selections can come from any table showing this component (search,
    // favorites, recently visited), not just this one - resolve by filename
    // from the shared in-memory recipe list rather than this table's own
    // dataSource.
    const recipes = Array.from(this.service.selectedForList)
      .map((filename) => this.service.findRecipe(filename))
      .filter((it): it is Recipe => !!it);

    const dialogRef = this.dialog.open(AddToListDialogComponent, {
      data: { recipes, defaultBatches: 1 },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.service.clearSelectedForList();
        this.service.selectMode = false;
      }
    });
  }

  clearSelection(): void {
    this.service.clearSelectedForList();
  }

  sortData(): void {
    this.service.sortTable(this.dataSource, this.sort, !this.removeColumns);
  }

  getResultClass(): string {
    return this.getClass('results');
  }

  getResultBoxClass(): string {
    return this.getClass('results-box');
  }

  private getClass(cssClass: string): string {
    return this.removeColumns ? '' : cssClass;
  }

  private buildUrl(recipe: string | null): string {
    const queryParams = new URLSearchParams(window.location.search);

    if (recipe === null) {
      queryParams.delete('recipe');
    } else {
      queryParams.set('recipe', recipe);
    }

    return `${location.pathname}?${queryParams.toString()}`;
  }
}
