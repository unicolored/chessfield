import { BehaviorSubject, Observable } from 'rxjs';
import { Group, Vector3 } from 'three';

export class Store {
  private updatePosSubject = new BehaviorSubject<boolean>(false);
  updatePosSubject$: Observable<boolean> = this.updatePosSubject.asObservable();
  updatePos = (b: boolean) => {
    this.updatePosSubject.next(b);
  };

  private gamePiecesSubject = new BehaviorSubject<Map<string, Group>>(new Map());
  gamePiecesSubject$: Observable<Map<string, Group>> = this.gamePiecesSubject.asObservable();
  updategamePieces = (map: Map<string, Group>) => {
    this.gamePiecesSubject.next(map);
  };

  private piecesPositionsSubject = new BehaviorSubject<Map<string, Vector3>>(new Map());
  piecesPositionsSubject$: Observable<Map<string, Vector3>> = this.piecesPositionsSubject.asObservable();
  updatepiecesPositions = (map: Map<string, Vector3>) => {
    this.piecesPositionsSubject.next(map);
  };

  // loadBlogPosts(limit = 3) {
  // return this.appService.getBlogPosts({ limit }).pipe(
  //     shareReplay(),
  //     catchError((err) => {
  //         const error = err as HttpErrorResponse;
  //         console.error('🛑 ERROR loadPageService', error.name);
  //         // return throwError(err);
  //         throw new Error(`🛑 ERROR loadPageService ${error.name}`);
  //     }),
  //
  //     map((res) => {
  //         if (!res) {
  //             throw new Error(`Invalid response from the App Service`);
  //         }
  //
  //         return res;
  //     }),
  //     // map((events) => {
  //     //   return events;
  //     // }),
  //     tap((items) => {
  //         this.blogPostsSubject.next(items);
  //     }),
  // );
  // }
}
