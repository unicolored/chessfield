import { BehaviorSubject, Observable } from 'rxjs';
import { Group, Vector3 } from 'three';
import { ChessfieldConfig } from '../resource/chessfield.config.ts';

export class Store {
  private piecesPositions!: Map<string, Vector3>;

  constructor(private readonly config?: ChessfieldConfig) {}

  getConfig(): ChessfieldConfig {
    return this.config ?? {};
  }

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

  // private piecesPositionsSubject = new BehaviorSubject<Map<string, Vector3>>(new Map());
  // piecesPositionsSubject$: Observable<Map<string, Vector3>> = this.piecesPositionsSubject.asObservable();
  // updatepiecesPositions = (map: Map<string, Vector3>) => {
  //   // this.piecesPositionsSubject.next(map);
  //   this.setPiecesPositions(map);
  // };

  getPiecesPositions(): Map<string, Vector3> {
    return this.piecesPositions;
  }

  setPiecesPositions(piecesPositions: Map<string, Vector3>) {
    this.piecesPositions = piecesPositions;
  }

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
