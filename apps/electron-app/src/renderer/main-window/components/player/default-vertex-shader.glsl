attribute vec2 aVertexPosition;

uniform vec2 uTranslateFactor;
uniform vec2 uScalingFactor;
uniform vec2 uOffsetFactor;

void main() {
  gl_Position = vec4((aVertexPosition + uTranslateFactor) * uScalingFactor + uOffsetFactor, 0.0, 1.0);
}
