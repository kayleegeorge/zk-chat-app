import React from 'react'
import styled from 'styled-components'

const Msg = styled.div`
    width: 40px;
    display: flex;
    font-color: white;
    font-size: 12px;
    border: 0.2px blue;
`

const Info = styled.style`
    font-color: lightgray;
    font-size: 8px;
`

export default function Message(message: string, epoch: bigint, alias?: string) {

    return (
        <Msg>
            {message}
            <Info>
                <>
                {alias} | {epoch}
                </>
            </Info>
        </Msg>
    )
    
}