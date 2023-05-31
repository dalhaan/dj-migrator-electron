attribute vec2 aVertexPosition;

uniform vec2 uTranslateFactor;
uniform vec2 uScalingFactor;

void main() {
  gl_Position = vec4((aVertexPosition + uTranslateFactor) * uScalingFactor, 0.0, 1.0);
}
