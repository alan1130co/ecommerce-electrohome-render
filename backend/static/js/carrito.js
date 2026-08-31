 
// static/js/carrito.js - ElectroHome Cart Functions

// Obtener CSRF Token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const csrftoken = getCookie('csrftoken');

// Función para agregar al carrito
function agregarAlCarrito(productId, quantity = 1, event = null) {
    // Obtener el botón que disparó el evento
    const button = event ? event.target : null;
    const originalText = button ? button.textContent : '';
    const originalClasses = button ? button.className : '';
    
    // Deshabilitar botón y mostrar estado de carga
    if (button) {
        button.disabled = true;
        button.textContent = 'Agregando...';
        button.className = button.className.replace('bg-yellow-500', 'bg-gray-400');
    }
    
    fetch(`/carrito/agregar/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': csrftoken
        },
        body: `quantity=${quantity}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Actualizar contador del carrito
            actualizarContadorCarrito(data.cart_total_items);
            
            // Mostrar notificación de éxito
            mostrarNotificacion(data.message, 'success');
            
            // Animar botón exitosamente
            if (button) {
                button.className = originalClasses.replace('bg-yellow-500', 'bg-green-500');
                button.textContent = '✓ Agregado';
                
                // Restaurar botón después de 2 segundos
                setTimeout(() => {
                    button.className = originalClasses;
                    button.textContent = originalText;
                    button.disabled = false;
                }, 2000);
            }
        } else {
            // Mostrar error
            mostrarNotificacion(data.message, 'error');
            if (button) restaurarBoton(button, originalText, originalClasses);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error al agregar al carrito', 'error');
        if (button) restaurarBoton(button, originalText, originalClasses);
    });
}

// Función auxiliar para restaurar el botón
function restaurarBoton(button, originalText, originalClasses) {
    button.textContent = originalText;
    button.className = originalClasses;
    button.disabled = false;
}

// Actualizar contador del carrito
function actualizarContadorCarrito(cantidad) {
    const cartCounter = document.getElementById('cart-counter');
    if (cartCounter) {
        cartCounter.textContent = cantidad;
        
        // Animar el contador
        cartCounter.classList.add('animate-pulse');
        setTimeout(() => {
            cartCounter.classList.remove('animate-pulse');
        }, 1000);
    }
}

// Mostrar notificación toast
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Configurar colores según el tipo
    const colores = {
        'success': 'bg-green-500',
        'error': 'bg-red-500',
        'info': 'bg-blue-500',
        'warning': 'bg-yellow-500'
    };
    
    const iconos = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'info': 'fa-info-circle',
        'warning': 'fa-exclamation-triangle'
    };
    
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl transform translate-x-full transition-all duration-300 ${colores[tipo]} text-white max-w-md`;
    
    notificacion.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas ${iconos[tipo]} text-xl"></i>
            <span class="font-medium">${mensaje}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notificacion);
    
    // Animar entrada
    setTimeout(() => {
        notificacion.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto-remover después de 4 segundos
    setTimeout(() => {
        notificacion.style.transform = 'translateX(400px)';
        setTimeout(() => {
            notificacion.remove();
        }, 300);
    }, 4000);
}

// Función para comprar ahora (agregar y redirigir)
function comprarAhora(productId, quantity = 1) {
    fetch(`/carrito/agregar/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': csrftoken
        },
        body: `quantity=${quantity}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            mostrarNotificacion('Redirigiendo al carrito...', 'success');
            setTimeout(() => {
                window.location.href = '/carrito/';
            }, 500);
        } else {
            mostrarNotificacion(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error al agregar al carrito', 'error');
    });
}

// Función para ir al carrito
function irAlCarrito() {
    window.location.href = '/carrito/';
}

// Cargar contador del carrito al iniciar
document.addEventListener('DOMContentLoaded', function() {
    cargarContadorCarrito();
});

// Función para cargar el contador del carrito
function cargarContadorCarrito() {
    // Hacer una petición silenciosa para obtener el contador
    fetch('/carrito/', {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.text())
    .then(html => {
        // Parsear el HTML de respuesta
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const serverCounter = doc.getElementById('cart-counter');
        
        if (serverCounter) {
            actualizarContadorCarrito(serverCounter.textContent);
        }
    })
    .catch(error => {
        console.log('No se pudo cargar el contador del carrito:', error);
    });
}

// Agregar funcionalidad global
window.agregarAlCarrito = agregarAlCarrito;
window.comprarAhora = comprarAhora;
window.irAlCarrito = irAlCarrito;
window.mostrarNotificacion = mostrarNotificacion;