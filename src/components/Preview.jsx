import React from 'react'

const Preview = ({ src, label }) => {
    return (
        <figure className='border rounded overflow-hidden'>
            <img
                src={src}
                alt={label}
                className='max-h-60 w-full object-contain bg-gray-100'
            />
            <figcaption className='text-xs text-gray-500 px-2 py-1 border-t'>
                {label}
            </figcaption>
        </figure>
    )
}

export default Preview
