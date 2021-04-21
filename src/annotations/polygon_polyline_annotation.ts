import { MarkupAnnotation, MarkupAnnotationObj, Color, LineEndingStyle } from './annotation_types';
import { ErrorList, InvalidAnnotationTypeError, InvalidVerticesError } from './annotation_errors';
import { CryptoInterface } from '../parser';
import { WriterUtil } from '../writer-util';
import { PDFVersion } from '../util';

export enum PolygonPolyLineIntent {
    PolygonCloud, PolyLineDimension, PolygonDimension
}

export interface PolygonPolyLineAnnotation extends MarkupAnnotation {
    vertices: number[]
    borderStyle? : any
    fill?: Color
    intent?: PolygonPolyLineIntent
    measure? : any
}

export class PolygonPolyLineAnnotationObj extends MarkupAnnotationObj implements PolygonPolyLineAnnotation {
    fill : Color | undefined
    vertices: number[] = []

    constructor() {
        super()
    }

    public writeAnnotationObject(cryptoInterface : CryptoInterface, pdfVersion:PDFVersion) : number[] {
        let ret : number[] = super.writeAnnotationObject(cryptoInterface, pdfVersion)

        if (this.fill) {
            let fill : Color = this.fill
            if (fill.r > 1) fill.r /= 255
            if (fill.g > 1) fill.g /= 255
            if (fill.b > 1) fill.b /= 255

            ret.push(WriterUtil.SPACE)
            ret = ret.concat(WriterUtil.FILL)
            ret.push(WriterUtil.SPACE)
            ret = ret.concat(WriterUtil.writeNumberArray([fill.r, fill.g, fill.b]))
            ret.push(WriterUtil.SPACE)
        }

        ret = ret.concat(WriterUtil.VERTICES)
        ret.push(WriterUtil.SPACE)
        ret = ret.concat(WriterUtil.writeNumberArray(this.vertices))
        ret.push(WriterUtil.SPACE)


        return ret
    }

    public validate(enact : boolean = true) : ErrorList {
        let errorList : ErrorList = super.validate(false)

        if (this.fill) {
            errorList = errorList.concat(this.checkColor(this.fill))
        }

        if (!this.vertices || this.vertices.length == 0) {
            errorList.push(new InvalidVerticesError("No vertices provided"))
        }

        if (this.vertices.length % 2 !== 0) {
            errorList.push(new InvalidVerticesError("number of vertices must be an even number"))
        }


        if (enact) {
            for(let error of errorList) {
                throw error
            }
        }

        return errorList
    }
}

export interface PolyLineAnnotation extends PolygonPolyLineAnnotation {
    lineEndingStyles? : LineEndingStyle[] // /LE
}

export class PolyLineAnnotationObj extends PolygonPolyLineAnnotationObj implements PolyLineAnnotation {
    lineEndingStyles : LineEndingStyle[] = []

    constructor() {
        super()
        this.type = "/PolyLine"
        this.type_encoded = [47, 80, 111, 108, 121, 76, 105, 110, 101] // '/PolyLine
    }

    public writeAnnotationObject(cryptoInterface : CryptoInterface, pdfVersion:PDFVersion) : number[] {
        let ret : number[] = super.writeAnnotationObject(cryptoInterface, pdfVersion)

        if (this.lineEndingStyles && this.lineEndingStyles.length >= 2) {
            ret = ret.concat(WriterUtil.LINE_ENDING)
            ret.push(WriterUtil.SPACE)
            ret.push(WriterUtil.ARRAY_START)
            ret = ret.concat(this.convertLineEndingStyle(this.lineEndingStyles[0]))
            ret.push(WriterUtil.SPACE)
            ret = ret.concat(this.convertLineEndingStyle(this.lineEndingStyles[1]))
            ret.push(WriterUtil.SPACE)
            ret.push(WriterUtil.ARRAY_END)
            ret.push(WriterUtil.SPACE)
        }

        return ret
    }

    public validate(enact : boolean = true) : ErrorList {
        let errorList : ErrorList = super.validate(false)

        if (this.type !== "/PolyLine") {
            errorList.push(new InvalidAnnotationTypeError(`Invalid annotation type ${this.type}`))
        }

        if (enact) {
            for(let error of errorList) {
                throw error
            }
        }

        return errorList
    }
}

export interface PolygonAnnotation extends PolygonPolyLineAnnotation {
    borderEffect?: any
}

export class PolygonAnnotationObj extends PolygonPolyLineAnnotationObj implements PolygonAnnotation {

    constructor() {
        super()
        this.type = "/Polygon"
        this.type_encoded = [47, 80, 111, 108, 121, 103, 111, 110] // = '/Polygon
    }

    public validate(enact : boolean = true) : ErrorList {
        let errorList : ErrorList = super.validate(false)

        if (this.type !== "/Polygon") {
            errorList.push(new InvalidAnnotationTypeError(`Invalid annotation type ${this.type}`))
        }

        if (enact) {
            for(let error of errorList) {
                throw error
            }
        }

        return errorList
    }
}
