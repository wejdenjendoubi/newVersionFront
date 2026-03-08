// angular import
import { Component, inject } from '@angular/core';

// bootstrap import
import { NgbDropdownConfig } from '@ng-bootstrap/ng-bootstrap';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { AuthService } from 'src/app/services/auth';

@Component({
  selector: 'app-nav-right',
  imports: [SharedModule],
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss'],
  providers: [NgbDropdownConfig],
})
export class NavRightComponent {
  // public props
  visibleUserList: boolean;
  chatMessage: boolean;
  friendId!: number;

  // constructor
  constructor() {
    this.visibleUserList = false;
    this.chatMessage = false;
  }

  // public method
  // eslint-disable-next-line
  onChatToggle(friendID: any) {
    this.friendId = friendID;
    this.chatMessage = !this.chatMessage;
  }

  private authService = inject(AuthService);

  onLogout() {

    const confirmLogout = confirm('Voulez-vous vraiment vous déconnecter ?');

    if (confirmLogout) {
      // Exécute clearStorage() et navigation vers /login
      this.authService.logout();
    }
  }
}
