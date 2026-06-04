interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div className={[
      'rounded-xl border bg-white p-6 dark:bg-slate-800 dark:border-slate-700',
      hover ? 'transition-shadow hover:shadow-md' : '',
      className
    ].join(' ')}>
      {children}
    </div>
  )
}
