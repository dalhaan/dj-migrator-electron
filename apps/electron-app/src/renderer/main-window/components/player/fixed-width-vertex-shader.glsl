attribute vec2 aVertexPosition;
attribute vec2 aOriginPosition;

uniform vec2 uTranslateFactor;
uniform vec2 uScalingFactor;
uniform vec2 uOffsetFactor;

void main() {
  vec2 offsetPos = aVertexPosition - aOriginPosition;
  vec2 newOriginPos = (aOriginPosition + uTranslateFactor) * uScalingFactor;

  gl_Position = vec4(newOriginPos + offsetPos + uOffsetFactor, 0.0, 1.0);
}