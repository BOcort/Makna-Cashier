// Quantity Stepper component
export default function Stepper({ value, onChange, min = 1, max = 99 }) {
  const decrease = () => {
    if (value > min) onChange(value - 1);
  };

  const increase = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className="stepper">
      <button onClick={decrease} disabled={value <= min} type="button">−</button>
      <span className="qty">{value}</span>
      <button onClick={increase} disabled={value >= max} type="button">+</button>
    </div>
  );
}
