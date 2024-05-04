import { Engine, State, LoaderType } from 'whiskerweb';
import { IM22Line_C } from "./IM22Line_C";
import { M22LineType } from "./M22LineType";

export class M22Scene extends State {

    private _scriptFilePath: string;
    private _script: IM22Line_C[];

    constructor(_script: IM22Line_C[] | string) {
        super();
        if(typeof _script == "string") {
            this._scriptFilePath = _script;
        } else {
            this._script = [..._script];
        }
    }

    private static getRequiredAssets(
        _script: IM22Line_C[]
    ): {
        characters: string[],
        sounds: string[],
        backgrounds: string[],
    } {
        const retVal = {
            characters: [],
            sounds: [],
            backgrounds: []
        };

        for(const line of _script) {
            switch(line.m_lineType) {
                case M22LineType.DRAW_BACKGROUND:
                    if(retVal.backgrounds.indexOf(line.m_parameters_txt[0]) === -1) {
                        retVal.backgrounds.push(line.m_parameters_txt[0]);
                    }
                    break;
                case M22LineType.DRAW_CHARACTER:
                    const compositeLine = line.m_parameters_txt[0] + "%" + line.m_parameters_txt[1];
                    if(retVal.characters.indexOf(compositeLine) === -1) {
                        retVal.characters.push(compositeLine);
                    }
                    break;
                case M22LineType.PLAY_MUSIC:
                case M22LineType.PLAY_STING:
                case M22LineType.PLAY_SFX_LOOPED:
                    if(retVal.sounds.indexOf(line.m_parameters_txt[0]) === -1) {
                        retVal.sounds.push(line.m_parameters_txt[0]);
                    }
                    break;
            }
        }

        return retVal;
    }

    onAwake(_engine: Engine) {
        console.log("M22Scene onAwake");
        _engine.setBackgroundColor(0x0e0e0e);

        console.log(
        );

        _engine.getTicker().start();
    }

    onResize(_engine: Engine, _params?: unknown): void {}

    async preload(_engine: Engine): Promise<void> {
        if(!_engine.getJSON(this._scriptFilePath) && !this._script?.length) {
            await _engine.loadAssets([
                {
                    type: LoaderType.JSON,
                    key: this._scriptFilePath,
                    path: this._scriptFilePath
                }
            ]);
        }

        const requiredAssets =
            M22Scene.getRequiredAssets(_engine.getJSON(this._scriptFilePath)["compiledLines"]);
        const requiredBackgrounds: {key: string, path: string, type: LoaderType}[] = requiredAssets.backgrounds.map((e) => {
            return {
                key: e,
                path: `backgrounds/${e}.png`,
                type: LoaderType.PIXI
            }
        });
        const requiredCharacters: {key: string, path: string, type: LoaderType}[] = requiredAssets.characters.map((e) => {
            return {
                key: e,
                path: `characters/${e.split("%")[0]}/${e.split("%")[1]}.png`,
                type: LoaderType.PIXI
            }
        });

        return _engine.loadAssets([
            ...requiredBackgrounds,
            ...requiredCharacters
        ]);
    }
}