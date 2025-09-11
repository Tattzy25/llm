import React from 'react';
import styled from 'styled-components';
import Loader from '../Loader';

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoaderOverlay: React.FC = () => (
  <Overlay>
    <Loader />
  </Overlay>
);

export default LoaderOverlay; // renamed to avoid clash with existing Loader
