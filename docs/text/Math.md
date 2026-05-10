# Math

Here we collect a variety of global mathematical functions and constants. You can still use the core JavaScript `Math` library as well.

## Constants

- `e` — the base of the natural logarithm (e)
- `pi` — the geometric constant (π)
- `phi` — the golden ratio (φ)
- `r2d` — the conversion factor between radians and degrees (180/π)
- `d2r` — the conversion factor between degrees and radians (π/180)

## Functions

- `exp(x)` — the exponential function
- `log(x)` — the natural logarithm
- `log10(x)` — the base 10 logarithm
- `sin(x)` — the sine function
- `cos(x)` — the cosine function
- `tan(x)` — the tangent function
- `abs(x)` — the absolute value
- `pow(x, y)` — the power function
- `sqrt(x)` — the square root function
- `sign(x)` — the sign function
- `floor(x)` — the floor function
- `ceil(x)` — the ceiling function
- `round(x)` — the rounding function
- `clamp(x, lim=[0, 1])` — clamp `x` to the range `lim`
- `rescale(x, lim=[0, 1])` — linearly rescale `x` to the range `lim`
- `polar(theta, radius=1, center=[0, 0])` — convert polar coordinates (`theta` in radians, `radius` scalar or size vector) to a 2D point around `center`
- `polard(angle, radius=1, center=[0, 0])` — same as `polar` but takes `angle` in degrees

Angles use gum's usual screen-space convention: `0` points right and `90` points down.
