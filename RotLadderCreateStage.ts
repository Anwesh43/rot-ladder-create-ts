const w : number = window.innerWidth
const h : number = window.innerHeight
const scGap : number = 0.05
const scDiv : number = 0.51
const strokeFactor : number = 90
const sizeFactor : number = 3
const foreColor : string = "#388E3C"
const backColor : string = "#212121"
const nodes : number = 5
const lines : number = 2

const scaleFactor : Function = (scale : number) : number => Math.floor(scale / scDiv)

const maxScale : Function = (scale : number, i : number, n : number)  : number => {
    return Math.max(0, scale - i / n)
}

const divideScale : Function = (scale : number, i : number, n : number) : number => {
    return Math.min(1 / n, maxScale(i, n)) * n
}

const mirrorScale : Function = (scale : number, a : number, b : number) : number => {
    const k : number = scaleFactor(scale)
    return (1 - k) / a + k / b
}

const drawRLCNode : Function = (context : CanvasRenderingContext2D, i : number, scale : number) => {
    const gap : number = h / (nodes + 1)
    const size : number = gap / sizeFactor
    const sc1 : number = divideScale(scale, 0, 2)
    const sc2 : number = divideScale(scale, 1, 2)
    context.lineCap = 'round'
    context.strokeStyle = foreColor
    context.lineWidth = Math.min(w, h) / strokeFactor
    context.save()
    context.translate(w / 2, 0.9 * h - gap * i)
    for (var j = 0; j < lines; j++) {
        context.save()
        context.translate(-size + 2 * size * j, 0)
        context.rotate(Math.PI / 2 * (1 - 2 * j) * divideScale(sc1, j, lines))
        context.beginPath()
        context.moveTo(0, 0)
        context.lineTo(2 * size * (1 - 2 * j), 0)
        context.stroke()
        context.restore()
    }
    context.save()
    context.translate(0, -gap * sc2)
    context.moveTo(-size, 0)
    context.lineTo(size, 0)
    context.stroke()
    context.restore()
    context.restore()
}

const updateValue : Function = (scale : number, dir : number, a : number, b : number) : number => {
    return mirrorScale(scale, a, b) * dir * scGap
}

class RotLadderCreateStage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor
        this.context.fillRect(0, 0, w, h)
    }

    handleTap() {
        this.canvas.onmousedown = () => {

        }
    }

    static init() {
        const stage : RotLadderCreateStage = new RotLadderCreateStage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {
    scale : number = 0
    dir : number = 0
    prevScale : number = 0

    update(cb : Function) {
        this.scale += updateValue(this.scale, this.dir, lines, 1)
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {

    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class RLCNode {
    prev : RLCNode
    next : RLCNode
    state : State = new State()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new RLCNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        drawRLCNode(context, this.i, this.state.scale)
        if (this.prev) {
            this.prev.draw(context)
        }
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : RLCNode {
        var curr : RLCNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr != null) {
            return curr
        }
        cb()
        return this
    }
}

class RotLadderCreate {
    curr : RLCNode = new RLCNode(0)
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.curr.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {
    rlc : RotLadderCreate = new RotLadderCreate()
    animator : Animator = new Animator()

    render(context : CanvasRenderingContext2D) {
        this.rlc.draw(context)
    }

    handleTap(cb : Function) {
        this.rlc.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.rlc.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}
