import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'ATO R&D Tax Incentive Guide — Unite Group';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#050505',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'system-ui',
          border: '1px solid #00F5FF',
        }}
      >
        <div style={{ color: '#00F5FF', fontSize: 18, marginBottom: 24, textTransform: 'uppercase', letterSpacing: 4 }}>
          UNITE GROUP × ATO COMPLIANCE
        </div>
        <div style={{ color: '#FFFFFF', fontSize: 56, fontWeight: 700, lineHeight: 1.1, marginBottom: 32, maxWidth: 900 }}>
          R&D Tax Incentive Recovery
        </div>
        <div style={{ color: '#A0A0A0', fontSize: 24, maxWidth: 800 }}>
          Claim up to 43.5% cash rebate on R&D spend. Australian businesses recovered $2.4B+ last year.
        </div>
        <div style={{ position: 'absolute', bottom: 80, right: 80, color: '#00FF88', fontSize: 18 }}>
          unite-group.in
        </div>
      </div>
    ),
    { ...size },
  );
}
