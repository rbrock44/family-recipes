import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

interface Tip {
  /** The same icon the feature's button shows, so the guide points at what's on screen. */
  icon: string;
  text: string;
}

interface Section {
  title: string;
  tips: Tip[];
}

export const ABOUT_SECTIONS: Section[] = [
  {
    title: 'Searching',
    tips: [
      { icon: 'search', text: 'Results update as you type. Every word has to match the recipe name, author, or number.' },
      { icon: 'tune', text: 'Advanced Search filters by category, or to Hooper Family Only: Grandma\'s recipes, even those under her descendants\' names.' },
      { icon: 'kitchen', text: 'Ingredients I have (in Advanced Search) finds recipes that use all of them, closest fit first. The +N on each shows how many more ingredients it needs.' },
      { icon: 'person', text: 'Browse by Author lists everyone with how many recipes they shared; the heart marks Hooper Family. Tap a name, or the author on any recipe, to see all of theirs.' },
      { icon: 'swap_vert', text: 'Click a column header to sort the results. Click a recipe to open it.' },
      { icon: 'link', text: 'Your search is saved in the address bar, so you can bookmark or send it.' },
    ],
  },
  {
    title: 'Jump To',
    tips: [
      { icon: 'search', text: 'Press Ctrl K (⌘ K on Mac), the "Jump to" button, or the round search button to find any recipe fast.' },
      { icon: 'keyboard', text: 'Use the arrow keys to move, Enter to open, and Esc to close.' },
    ],
  },
  {
    title: 'Recipe Page',
    tips: [
      { icon: 'calculate', text: 'Change Batches to scale every ingredient and the serving size.' },
      { icon: 'soup_kitchen', text: 'Cook mode shows big, tappable ingredients and steps to check off, and keeps the screen on while you cook.' },
      { icon: 'format_underlined', text: 'An underlined ingredient has a possible conversion. Hover over it to see it.' },
      { icon: 'water_drop', text: 'Liquid and Dry open measurement conversion charts.' },
      { icon: 'print', text: 'Print gives a plain one-page copy for a recipe card or binder, scaled to your batches.' },
      { icon: 'photo', text: 'Shows the original recipe card, when there is one.' },
      { icon: 'edit_note', text: 'My Notes keeps your own notes on a recipe, like "use less salt". Share sends a link to the recipe with your note; whoever opens it can add it to theirs.' },
      { icon: 'chevron_right', text: 'The arrows at the top step through your search results without going back.' },
    ],
  },
  {
    title: 'Favorites and Recently Visited',
    tips: [
      { icon: 'favorite_border', text: 'Tap the heart to favorite a recipe. Favorites and recently visited recipes show on the home page.' },
      { icon: 'close', text: 'Remove a recipe from Recently Visited with the X.' },
    ],
  },
  {
    title: 'Lists',
    tips: [
      { icon: 'playlist_add', text: 'Add a recipe to a new or existing list, from the results or the recipe page.' },
      { icon: 'check_box', text: 'Tick the checkbox in the results header to select several recipes, then add them all at once.' },
      { icon: 'shopping_cart', text: 'Combined Ingredients merges every recipe\'s ingredients, times its number of batches, into a single checkable list for shopping or inventory.' },
      { icon: 'add', text: 'Add your own items under Other Ingredients for anything a recipe doesn\'t cover.' },
      { icon: 'shuffle', text: 'What\'s for dinner? Pick a random recipe from the list. Next won\'t repeat one until you Reset.' },
      { icon: 'share', text: 'Copy a link to the list. Whoever opens it gets their own copy.' },
    ],
  },
];

@Component({
  selector: 'app-about-dialog',
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButton, MatIcon],
})
export class AboutDialogComponent {
  readonly sections = ABOUT_SECTIONS;
}
