import { GameObject, Graphics, IVector2, Container, HelperFunctions } from "whiskerweb";

export class AimingReticule extends GameObject {

  public mainReticule: Graphics;
  private _centerRef: IVector2;
  private _targetObj: Container;
  private _lastMousePosition: IVector2 = {x: 0, y: 0};
  private _actualAimPosition: IVector2 = {x: 0, y: 0};
  private _debugGraphics: Graphics;

  public getActualAimPosition(): IVector2 {
    return this._actualAimPosition;
  }

  constructor() {
    super();
    this._debugGraphics = new Graphics();
    this.addChild(this._debugGraphics);

    const background = new Graphics()
      .rect(-1000, -1000, 2000, 2000)
      .fill({
        color: 0x000000,
        alpha: 0
      });
    background.position.set(ENGINE.getRenderManager().width * 0.5, ENGINE.getRenderManager().height * 0.5);
    this.addChild(background);

    const mainReticule = this.mainReticule = new Graphics();
    mainReticule
      .circle(0, 0, 20)
      .stroke({
        color: 0xff0000,
        width: 2
      })
      .fill({
        color: 0xffffff,
        alpha: 1
      });
    this.addChild(mainReticule);

    background.interactive = true;
    background.interactiveChildren = true;
    background.on("pointermove", (event) => {
      this._lastMousePosition.x = event.data.global.x;
      this._lastMousePosition.y = event.data.global.y;
    });
  }

  setCenterRef(_ref: IVector2): void {
    this._centerRef = _ref;
  }

  setTargetObject(_object: Container): void {
    this._targetObj = _object;
  }

  onStep(_dt: number) {
    super.onStep(_dt);
    this._actualAimPosition.x = HelperFunctions.lerp(
      this._actualAimPosition.x,
      this._lastMousePosition.x + Math.sin(Date.now() * 0.001) * 4,
      _dt * 0.1
    );
    this._actualAimPosition.y = HelperFunctions.lerp(
      this._actualAimPosition.y,
      this._lastMousePosition.y + Math.cos(Date.now() * 0.001) * 4,
      _dt * 0.1
    );
    this.mainReticule.position.set(this._actualAimPosition.x, this._actualAimPosition.y);

    if(this._centerRef) {
      if(this._targetObj) {
        // get angle from center of screen to mouse position
        const angle = Math.atan2(
          this._actualAimPosition.y - ENGINE.getRenderManager().height * 0.5,
          this._actualAimPosition.x - ENGINE.getRenderManager().width * 0.5
        );
        this._targetObj.rotation = angle - Math.PI * 0.5;
      }
    }

    this._debugGraphics.clear();
    this._debugGraphics
      .lineTo(
        ENGINE.getRenderManager().width * 0.5,
        ENGINE.getRenderManager().height * 0.5,
      )
      .stroke({
        color: 0xff0000,
        width: 2
      })
      .lineTo(
        this._lastMousePosition.x,
        this._lastMousePosition.y,
      )
      .stroke({
        color: 0x000000,
        width: 0
      })
      .lineTo(
        ENGINE.getRenderManager().width * 0.5,
        ENGINE.getRenderManager().height * 0.5,
      )
      .stroke({
        color: 0x00ff00,
        width: 2
      })
      .lineTo(
        this._actualAimPosition.x,
        this._actualAimPosition.y,
      )
  }
}