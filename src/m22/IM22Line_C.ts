import { M22LineType } from "./M22LineType";

export interface IM22Line_C {
    m_lineType: M22LineType;
    m_lineTypeSecondary: M22LineType;
    m_parameters: Array<number> | null;
    m_parameters_txt: Array<string> | null;
    m_lineContents: string;
    m_speaker: {
        name: string;
        color: string; // "0, 255, 0, 255"
    } | null;
    m_ID: string;
    m_origScriptPos: string;
}