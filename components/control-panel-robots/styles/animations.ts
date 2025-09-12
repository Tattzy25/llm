export const holographicStyles = `
/* Holographic UI Styles */
:root {
  --holo-cyan: rgba(0, 255, 255, 0.4);
  --holo-purple: rgba(147, 51, 234, 0.6);
  --glow-color: rgba(0, 255, 255, 0.3);
}
.screen-flicker {
  animation: flicker 0.15s infinite;
}
@keyframes flicker {
  0% { opacity: 0.95; }
  50% { opacity: 1; }
  100% { opacity: 0.95; }
}
.data-stream-line {
  position: absolute;
  top: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(to bottom, transparent, var(--holo-cyan), transparent);
  animation: stream 5s linear infinite;
}
@keyframes stream {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}
.ambient-pulse {
  animation: ambient-pulse 2s infinite ease-in-out;
}
@keyframes ambient-pulse {
  0% { box-shadow: 0 0 0 0 var(--glow-color); }
  50% { box-shadow: 0 0 20px 10px transparent; }
  100% { box-shadow: 0 0 0 0 var(--glow-color); }
}
.holographic-card {
  border: 1px solid var(--holo-cyan);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  box-shadow: 0 0 30px var(--glow-color);
}
.holographic-glow {
  box-shadow: 0 0 15px var(--holo-cyan);
}
.title-materialize {
  animation: materialize 1s ease-out;
}
@keyframes materialize {
  0% { opacity: 0; filter: blur(10px); transform: translateY(20px); }
  100% { opacity: 1; filter: blur(0); transform: translateY(0); }
}
`;