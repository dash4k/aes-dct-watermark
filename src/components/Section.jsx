import React from 'react'

const Section = ({ styles, step, title, description, children }) => (
    <section className={styles}>
        <header className='border-b border-zinc-200 px-5 py-3'>
            <div className='flex items-baseline gap-3'>
                <span className='font-mono text-xs text-zinc-400'>{step}</span>
                <h2 className='text-sm font-semibold text-zinc-900'>{title}</h2>
            </div>
            {description && (
                <p className='mt-1 pl-7 text-sm text-zinc-500'>{description}</p>
            )}
        </header>
        <div className='space-y-4 p-5'>{children}</div>
    </section>
)

export default Section
