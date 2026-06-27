import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Variants control the visual style of the button.
 */
type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-gray-900 hover:brightness-95 active:brightness-90',
  secondary:
    'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 active:bg-gray-100',
  danger:
    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
};

/**
 * Reusable button component following the Cube Count design system.
 *
 * Uses the approved border radius, padding, and transition timing.
 * All gameplay and navigation buttons should use this component.
 */
export function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        rounded-xl px-8 py-3
        text-base font-medium
        transition-all duration-150
        cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANT_CLASSES[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
