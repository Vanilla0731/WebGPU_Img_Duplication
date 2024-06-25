/*
** EPITECH PROJECT, 2024
** WebGPU_Img_Duplication
** File description:
** index
*/

const canvas = document.getElementById("myCanvas");

if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
}

const adapter = await navigator.gpu.requestAdapter();

if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
}

const device = await adapter.requestDevice();
const context = canvas.getContext("webgpu");
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

context.configure({
    device: device,
    format: canvasFormat,
});

const vertexShaderCode = `
struct VertexOutput {
    @builtin(position) position : vec4<f32>,
    @location(0) fragCoord : vec2<f32>,
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
    var positions = array<vec2<f32>, 3>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>( 3.0, -1.0),
        vec2<f32>(-1.0,  3.0)
    );

    var output : VertexOutput;
    output.position = vec4<f32>(positions[vertexIndex], 0.0, 1.0);
    output.fragCoord = (positions[vertexIndex] + vec2<f32>(1.0, 1.0)) * 0.5;
    return output;
}
`;

const fragmentShaderCode = `
@fragment
fn fragmentMain(@location(0) fragCoord : vec2<f32>) -> @location(0) vec4<f32> {
    let center = vec2<f32>(0.5, 0.5);
    let radius = 0.9 * 0.5;
    let dist = distance(fragCoord, center);

    if (dist > radius) {
        discard;
    }

    var startHeight = 0.550;
    var offsetDiscard = 0.010;
    var offsetHeight = 0.070;

    for (var i = 0; i < 5; i++) {
        if (fragCoord.y > startHeight && fragCoord.y < startHeight + offsetDiscard) {
        discard;
        break;
        }
        offsetDiscard *= 1.6;
        startHeight -= offsetHeight;
        offsetHeight += 0.020;
    }

    let verticalPos = (fragCoord.y - (0.5 - radius)) / (2.0 * radius);
    let t = clamp(verticalPos * (1.0 / 0.7), 0.0, 1.0);
    let color = mix(vec4<f32>(1.0, 0.0, 0.5, 1.0), vec4<f32>(1.0, 1.0, 0.0, 1.0), t);

    return color;
}
`;

const vertexShaderModule = device.createShaderModule({
    code: vertexShaderCode,
});

const fragmentShaderModule = device.createShaderModule({
    code: fragmentShaderCode,
});

const pipeline = device.createRenderPipeline({
    vertex: {
        module: vertexShaderModule,
        entryPoint: "vertexMain",
    },
    fragment: {
        module: fragmentShaderModule,
        entryPoint: "fragmentMain",
        targets: [{
            format: canvasFormat,
        }],
    },
    primitive: {
        topology: "triangle-list",
    },
    layout: "auto",
});

const commandEncoder = device.createCommandEncoder();

const textureView = context.getCurrentTexture().createView();

const renderPassDescriptor = {
    colorAttachments: [{
        view: textureView,
        loadOp: "clear",
        clearValue: { r: 0.3, g: 0.65, b: 0.97, a: 1 },
        storeOp: "store",
    }],
};

const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
passEncoder.setPipeline(pipeline);
passEncoder.draw(3, 1, 0, 0);
passEncoder.end();

const commandBuffer = commandEncoder.finish();
device.queue.submit([commandBuffer]);
