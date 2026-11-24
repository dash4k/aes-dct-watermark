import React from 'react'

const useObjectUrl = (blob) => {
    const url = React.useMemo(
        () => (blob ? URL.createObjectURL(blob) : null),
        [blob],
    )

    React.useEffect(() => {
        return () => {
            if (url) URL.revokeObjectURL(url)
        }
    }, [url])

    return url
}

export default useObjectUrl
