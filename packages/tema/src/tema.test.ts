import { describe, expect, it } from 'vitest';
import { contraste, revisarContraste, resolverTema, temaACss } from './index';

describe('tema', () => {
  it('calcula contraste WCAG', () => {
    expect(contraste('#000000', '#ffffff')).toBe(21);
    expect(contraste('#ffffff', '#ffffff')).toBe(1);
  });

  it('los pares declarados del tema base pasan AA (4.5:1)', () => {
    expect(revisarContraste()).toEqual([]);
  });

  it('aplica sobrescrituras del sitio', () => {
    expect(resolverTema({ colores: { primario: '#ff0000' } }).colores.primario).toBe('#ff0000');
    expect(temaACss({ colores: { primario: '#ff0000' } })).toContain('--k-primario: #ff0000');
  });
});
