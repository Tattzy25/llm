import React from 'react';
import styled from 'styled-components';

const ButtonWrapper = styled.div`
  .button {
    margin: 0;
    height: auto;
    background: transparent;
    padding: 0;
    border: none;
    cursor: pointer;
    --border-right: 6px;
    --text-stroke-color: rgba(255,255,255,0.6);
    --animation-color: #f54a00;
    --fs-size: 1.25em;
    letter-spacing: 3px;
    font-size: var(--fs-size);
    font-family: Arial;
    position: relative;
    text-transform: uppercase;
    color: transparent;
    -webkit-text-stroke: 1px var(--text-stroke-color);
  }
  .hover-text {
    position: absolute;
    box-sizing: border-box;
    color: var(--animation-color);
    width: 0%;
    inset: 0;
    border-right: var(--border-right) solid var(--animation-color);
    overflow: hidden;
    transition: 0.5s;
    -webkit-text-stroke: 1px var(--animation-color);
  }
  .button:hover .hover-text {
    width: 100%;
    filter: drop-shadow(0 0 23px var(--animation-color));
  }
`;

interface GenerateButtonProps {
  generateUrls: () => void;
  loading: boolean;
}

const GenerateButton: React.FC<GenerateButtonProps> = ({ generateUrls, loading }) => (
  <ButtonWrapper>
    <button className="button" onClick={generateUrls} disabled={loading}>
      <span className="actual-text">&nbsp;generate&nbsp;</span>
      <span aria-hidden="true" className="hover-text">&nbsp;generate&nbsp;</span>
    </button>
  </ButtonWrapper>
);

export default GenerateButton;
