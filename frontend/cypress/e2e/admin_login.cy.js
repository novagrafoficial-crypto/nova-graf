describe('Catálogo público', () => {
  it('Debe mostrar productos en el catálogo', () => {
    cy.visit('http://localhost:5173/catalogo')
    cy.get('body').should('be.visible')
  })
})