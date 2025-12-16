/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        industrial: {
          bg: '#1a1a1a',
          metal: '#2a2a2a',
          'metal-light': '#3a3a3a',
          rust: '#a85a32',
          'rust-dark': '#7a3e21',
          text: '#c0c0c0',
          'text-muted': '#707070',
        },
      },
      boxShadow: {
        'metal-outset': '6px 6px 12px #101010, -3px -3px 8px #3a3a3a',
        'metal-inset': 'inset 3px 3px 6px #151515, inset -2px -2px 4px #353535',
        'rust-glow': '0 0 15px rgba(168, 90, 50, 0.3)',
      },
      backgroundImage: {
        'brushed-metal': 'linear-gradient(145deg, #333, #222)',
        'rust-gradient': 'linear-gradient(to right, #a85a32, #dfa07a)',
        'rust-gradient-vertical': 'linear-gradient(to bottom, #a85a32, #7a3e21)',
      },
    },
  },
};
