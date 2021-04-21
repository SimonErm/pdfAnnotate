import { MarkupAnnotation, MarkupAnnotationObj, LineEndingStyle } from './annotation_types';
import { ErrorList, InvalidAnnotationTypeError } from './annotation_errors';
import { CryptoInterface } from '../parser';
import { WriterUtil } from '../writer-util';
import { Util, PDFVersion } from '../util'

export enum TextJustification {
    Left, Centered, Right
}

export enum FreeTextType {
    FreeText, FreeTextCallout, FreeTextTypeWriter
}

export interface FreeTextAnnotation extends MarkupAnnotation {
    textJustification?: TextJustification // /Q
    defaultAppearance: string // /DA
    defaultStyleString?: string // /DS
    calloutLine?: number[] // /CL
    freeTextType?: FreeTextType // /IT
    borderEffect?: any // /BE
    borderStyle?: any // /BS
    differenceRectangle?: number[] // /RD
    lineEndingStyle?: LineEndingStyle // LE
}

export class FreeTextAnnotationObj extends MarkupAnnotationObj implements FreeTextAnnotation {
    defaultAppearance : string = "/Invalid_font 9 Tf" // /DA
    defaultStyleString : string | undefined
    differenceRectangle : number[] = []
    textJustification : TextJustification = TextJustification.Left // /Q
    calloutLine: number[] = []
    freeTextType: FreeTextType = FreeTextType.FreeText
    lineEndingStyle : LineEndingStyle = LineEndingStyle.None

    constructor() {
        super()
        this.type = "/FreeText"
        this.type_encoded = [47, 70, 114, 101, 101, 84, 101, 120, 116] // = '/FreeText'
    }

    private convertJustification(just : TextJustification) : number {
        switch (just) {
            case TextJustification.Left:
                return 0
            case TextJustification.Centered:
                return 1
            case TextJustification.Right:
                return 2
            default:
                return 0
        }
    }

    private convertFreeTextType(ft : FreeTextType) : number[] {
        switch (ft) {
            case FreeTextType.FreeText:
                return Util.convertStringToAscii("/FreeText")
            case FreeTextType.FreeTextCallout:
                return Util.convertStringToAscii("/FreeTextCallout")
            case FreeTextType.FreeTextTypeWriter:
                return Util.convertStringToAscii("/FreeTextTypeWriter")
            default:
                return Util.convertStringToAscii("/FreeText")
        }
    }

    public writeAnnotationObject(cryptoInterface : CryptoInterface, pdfVersion: PDFVersion): number[]{
        let ret : number[] = super.writeAnnotationObject(cryptoInterface, pdfVersion)

        ret.push(WriterUtil.SPACE)
        ret = ret.concat(WriterUtil.DEFAULT_APPEARANCE)
        ret.push(WriterUtil.SPACE)
        ret.push(WriterUtil.BRACKET_START)
        ret = ret.concat(Util.convertStringToAscii(this.defaultAppearance))
        ret.push(WriterUtil.BRACKET_END)
        ret.push(WriterUtil.SPACE)

        ret.push(WriterUtil.SPACE)
        ret = ret.concat(WriterUtil.TEXT_JUSTIFICATION)
        ret.push(WriterUtil.SPACE)
        ret = ret.concat(Util.convertNumberToCharArray(this.convertJustification(this.textJustification)))
        ret.push(WriterUtil.SPACE)

        ret = ret.concat(WriterUtil.IT)
        ret.push(WriterUtil.SPACE)
        ret = ret.concat(this.convertFreeTextType(this.freeTextType))
        ret.push(WriterUtil.SPACE)

        if (this.calloutLine.length > 0) {
            ret = ret.concat(WriterUtil.CALLOUT_LINE)
            ret.push(WriterUtil.SPACE)
            ret = ret.concat(WriterUtil.writeNumberArray(this.calloutLine))
            ret.push(WriterUtil.SPACE)
        }

        if (this.lineEndingStyle !== LineEndingStyle.None) {
            ret = ret.concat(WriterUtil.LINE_ENDING)
            ret.push(WriterUtil.SPACE)
            ret = ret.concat(this.convertLineEndingStyle(this.lineEndingStyle))
            ret.push(WriterUtil.SPACE)
        }

        if (this.defaultStyleString && this.defaultStyleString !== "") {
            ret = ret.concat(WriterUtil.DEFAULT_STYLE_STRING)
            ret.push(WriterUtil.SPACE)
            ret.push(WriterUtil.BRACKET_START)
            ret = ret.concat(Util.convertStringToAscii(this.defaultStyleString))
            ret.push(WriterUtil.BRACKET_END)
            ret.push(WriterUtil.SPACE)
        }

        if (this.differenceRectangle && this.differenceRectangle.length > 0) {
            ret = ret.concat(WriterUtil.DIFFERENCE_RECTANGLE)
            ret.push(WriterUtil.SPACE)
            ret = ret.concat(WriterUtil.writeNumberArray(this.differenceRectangle))
            ret.push(WriterUtil.SPACE)
        }

        return ret
    }

    public validate(enact : boolean = true) : ErrorList {
        let errorList : ErrorList = super.validate(false)

        if (this.type !== "/FreeText") {
            errorList.push(new InvalidAnnotationTypeError(`Invalid annotation type ${this.type}`))
        }

        if (this.calloutLine && this.calloutLine.length > 0 && this.freeTextType !== FreeTextType.FreeTextCallout) {
            console.log("Warning: Callout line only relevant for free text type: 'Callout'")
        }

        if (enact) {
            for(let error of errorList) {
                throw error
            }
        }

        return errorList
    }
}
