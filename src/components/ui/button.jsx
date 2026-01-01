export function Button({ className, variant = "primary", ...props }) {
  const base = "px-4 py-2 rounded-md font-medium transition";
  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 hover:bg-gray-100",
  };

  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {props.children}
    </button>
  );
}
