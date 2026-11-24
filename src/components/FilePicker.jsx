import React from 'react'

const FilePicker = ({ file, onFile, hint }) => {
    const ref = React.useRef(null)

    return (
        <div
            onClick={() => ref.current.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f) onFile(f)
            }}
            className='border-2 border-dashed border-gray-300 rounded p-6 text-center cursor-pointer hover:border-indigo-400'
        >
            <p className='text-sm'>
                {file ? file.name : 'Click or drop an image'}
            </p>
            <p className='text-xs text-gray-500'>{hint}</p>
            <input
                ref={ref}
                type='file'
                accept='image/*'
                hidden
                onChange={(e) => {
                    if (e.target.files[0]) onFile(e.target.files[0])
                    e.target.value = ''
                }}
            />
        </div>
    )
}

export default FilePicker
