import {AppLayout} from '@/components/layouts/AppLayout';
import {useCheckout, type AddressForm} from '@/hooks/useCheckout';
import {OrderType} from '@/models/order.model';
import {formatPrice} from '@/utils/format';
import {Check, MapPin, Truck, Store, AlertCircle, Plus} from 'lucide-react';
import styles from './checkout.module.css';
import {AddressAutocompleteInput} from "@/components/ui/addressAutocompleteInput.tsx";
import {PhoneModal} from "@/components/ui/phoneModal.tsx";

export default function Checkout() {
    const c = useCheckout();

    if (c.settingsLoading) {
        return (
            <AppLayout>
                <div className={styles.loadingPage}>
                    <div className="spinner"/>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <div className="section-header">Commander</div>
                    <p className={styles.headerSub}>
                        Choisissez votre mode de récupération et finalisez votre commande.
                    </p>
                </div>

                <form className={styles.layout} onSubmit={c.handleSubmit}>
                    <div className={styles.mainCol}>

                        <section className={`card-dark ${styles.section}`}>
                            <h2 className={styles.sectionTitle}>1. Mode de récupération</h2>
                            <div className={styles.typeGrid}>
                                <button
                                    type="button"
                                    className={`${styles.typeBtn} ${c.orderType === OrderType.PICKUP ? styles.typeBtnActive : ''}`}
                                    onClick={() => c.setOrderType(OrderType.PICKUP)}
                                >
                                    <Store size={24}/>
                                    <div className={styles.typeLabel}>Retrait en boutique</div>
                                    <div className={styles.typeDesc}>Gratuit</div>
                                </button>
                                <button
                                    type="button"
                                    disabled={!c.deliveryEnabled}
                                    className={`${styles.typeBtn} ${c.orderType === OrderType.DELIVERY ? styles.typeBtnActive : ''} ${!c.deliveryEnabled ? styles.typeBtnDisabled : ''}`}
                                    onClick={() => c.deliveryEnabled && c.setOrderType(OrderType.DELIVERY)}
                                >
                                    <Truck size={24}/>
                                    <div className={styles.typeLabel}>Livraison</div>
                                    <div className={styles.typeDesc}>
                                        {c.deliveryEnabled ? 'Prix selon distance' : 'Indisponible'}
                                    </div>
                                </button>
                            </div>
                            {!c.deliveryEnabled && (
                                <div className={styles.infoRow}>
                                    <AlertCircle size={14}/>
                                    <span>Les livraisons sont temporairement indisponibles.</span>
                                </div>
                            )}
                        </section>

                        {!c.isAuthenticated && (
                            <section className={`card-dark ${styles.section}`}>
                                <h2 className={styles.sectionTitle}>2. Vos coordonnées</h2>
                                <p className={styles.sectionSub}>
                                    Pas de compte ? Pas de problème.{' '}
                                    <a href="/login" className={styles.inlineLink}>
                                        Se connecter
                                    </a>{' '}
                                    pour aller plus vite la prochaine fois.
                                </p>
                                <div className={styles.formGrid}>
                                    <Field label="Nom complet" required>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            value={c.guestName}
                                            onChange={(e) => c.setGuestName(e.target.value)}
                                            required
                                        />
                                    </Field>
                                    <Field label="Email" required>
                                        <input
                                            type="email"
                                            className={styles.input}
                                            value={c.guestEmail}
                                            onChange={(e) => c.setGuestEmail(e.target.value)}
                                            required
                                        />
                                    </Field>
                                    <Field label="Téléphone" required>
                                        <input
                                            type="tel"
                                            className={styles.input}
                                            value={c.guestPhone}
                                            onChange={(e) => c.setGuestPhone(e.target.value)}
                                            required
                                        />
                                    </Field>
                                </div>
                            </section>
                        )}

                        {c.orderType === OrderType.DELIVERY && (
                            <section className={`card-dark ${styles.section}`}>
                                <h2 className={styles.sectionTitle}>
                                    {c.isAuthenticated ? '2.' : '3.'} Adresse de livraison
                                </h2>

                                {c.isAuthenticated ? (
                                    <>
                                        {c.userAddresses.length > 0 && !c.showNewAddressForm && (
                                            <div className={styles.addressList}>
                                                {c.userAddresses.map((addr) => (
                                                    <button
                                                        key={addr.id}
                                                        type="button"
                                                        className={`${styles.addressCard} ${c.selectedAddressId === addr.id ? styles.addressCardActive : ''}`}
                                                        onClick={() => c.setSelectedAddressId(addr.id)}
                                                    >
                                                        <div className={styles.addressIcon}>
                                                            <MapPin size={16}/>
                                                        </div>
                                                        <div className={styles.addressBody}>
                                                            {addr.label && (
                                                                <div className={styles.addressLabel}>{addr.label}</div>
                                                            )}
                                                            <div className={styles.addressLine}>
                                                                {addr.street} {addr.number}
                                                                {addr.box ? ` bte ${addr.box}` : ''}
                                                            </div>
                                                            <div className={styles.addressLineSub}>
                                                                {addr.postalCode} {addr.city} · {addr.country}
                                                            </div>
                                                        </div>
                                                        {c.selectedAddressId === addr.id && (
                                                            <div className={styles.addressCheck}>
                                                                <Check size={14} strokeWidth={3}/>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    className={styles.addAddressBtn}
                                                    onClick={() => c.setShowNewAddressForm(true)}
                                                >
                                                    <Plus size={14}/> Ajouter une nouvelle adresse
                                                </button>
                                            </div>
                                        )}

                                        {c.showNewAddressForm && (
                                            <>
                                                <AddressAutocompleteInput
                                                    label="Rechercher votre adresse"
                                                    value={c.newAddressQuery}
                                                    onChange={c.setNewAddressQuery}
                                                    onResolved={(r) => c.handleAddressResolved(r, false)}
                                                    placeholder="Ex : Rue de la Loi 16, Bruxelles"
                                                    required
                                                />
                                                {c.newAddress.street && (
                                                    <AddressFormFields
                                                        value={c.newAddress}
                                                        onChange={c.setNewAddress}
                                                    />
                                                )}
                                                {c.userAddresses.length > 0 && (
                                                    <button
                                                        type="button"
                                                        className={styles.backLink}
                                                        onClick={() => c.setShowNewAddressForm(false)}
                                                    >
                                                        ← Utiliser une adresse existante
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <AddressAutocompleteInput
                                            label="Votre adresse de livraison"
                                            value={c.guestAddressQuery}
                                            onChange={c.setGuestAddressQuery}
                                            onResolved={(r) => c.handleAddressResolved(r, true)}
                                            placeholder="Ex : Avenue Louise 54, Bruxelles"
                                            required
                                        />
                                        {c.guestAddress.street && (
                                            <AddressFormFields
                                                value={c.guestAddress}
                                                onChange={c.setGuestAddress}
                                            />
                                        )}
                                    </>
                                )}

                                {c.isDeliveryLoading && (
                                    <div className={styles.deliveryRecalcRow}>
                                        <div className="spinner" style={{width: 14, height: 14}}/>
                                        Calcul des frais en cours…
                                    </div>
                                )}
                                {!c.isDeliveryLoading && c.deliveryCoords.lat !== null && (
                                    <div className={c.outOfRange ? styles.errorInfoRow : styles.successInfoRow}>
                                        <Truck size={14}/>
                                        {c.outOfRange
                                            ? `Adresse hors zone (${c.distanceKm?.toFixed(1)} km — max 10 km)`
                                            : `${c.distanceKm?.toFixed(1)} km · Frais de livraison : ${c.deliveryLabel}`
                                        }
                                    </div>
                                )}
                            </section>
                        )}

                        <section className={`card-dark ${styles.section}`}>
                            <h2 className={styles.sectionTitle}>
                                {c.orderType === OrderType.DELIVERY
                                    ? c.isAuthenticated ? '3.' : '4.'
                                    : c.isAuthenticated ? '2.' : '3.'
                                } Créneau horaire
                            </h2>
                            {c.slots.length === 0 ? (
                                <div className={styles.emptySlots}>
                                    <AlertCircle size={20}/>
                                    <div>
                                        <div style={{fontWeight: 600, marginBottom: 4}}>Aucun créneau disponible</div>
                                        <span>Tous les créneaux d'aujourd'hui sont complets ou passés. Revenez plus tard ou contactez-nous.</span>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.slotGrid}>
                                    {c.slots.map((slot) => (
                                        <button
                                            key={slot.id}
                                            type="button"
                                            className={`${styles.slotBtn} ${c.selectedSlotId === slot.id ? styles.slotBtnActive : ''}`}
                                            onClick={() => c.setSelectedSlotId(slot.id)}
                                        >
                                            <div className={styles.slotTime}>
                                                {slot.startTime} – {slot.endTime}
                                            </div>
                                            <div className={styles.slotRemaining}>
                                                {slot.maxCapacity - (slot.currentBookings ?? 0)} place{slot.maxCapacity - (slot.currentBookings ?? 0) > 1 ? 's' : ''}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className={`card-dark ${styles.section}`}>
                            <h2 className={styles.sectionTitle}>Note (optionnel)</h2>
                            <textarea
                                className={styles.textarea}
                                placeholder="Instructions spéciales, allergies, etc."
                                value={c.customerNote}
                                onChange={(e) => c.setCustomerNote(e.target.value)}
                                rows={3}
                            />
                        </section>

                    </div>

                    <aside className={styles.recapCol}>
                        <div className={`card-dark ${styles.recap}`}>
                            <h2 className={styles.recapTitle}>Récapitulatif</h2>

                            <div className={styles.recapItems}>
                                {c.items.map((item, i) => {
                                    const label = item.type === 'menu'
                                        ? item.menu.name
                                        : item.product.name;
                                    return (
                                        <div key={i} className={styles.recapItem}>
                                            <span>{item.quantity}× {label}</span>
                                            <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="divider-orange"/>

                            <div className={styles.recapRow}>
                                <span>Sous-total</span>
                                <span>{formatPrice(c.subtotal)}</span>
                            </div>

                            {c.orderType === OrderType.DELIVERY && (
                                <div className={`${styles.recapRow} ${c.outOfRange ? styles.recapRowError : ''}`}>
                                    <span>
                                        Livraison{' '}
                                        {c.distanceKm ? `(${c.distanceKm.toFixed(1)} km)` : ''}
                                    </span>
                                    <span>
                                        {c.deliveryCoords.lat === null
                                            ? '—'
                                            : c.outOfRange
                                                ? 'Hors zone'
                                                : c.deliveryFee === 0
                                                    ? 'Gratuit'
                                                    : formatPrice(c.deliveryFee)
                                        }
                                    </span>
                                </div>
                            )}

                            <div className={styles.recapTotal}>
                                <span>Total</span>
                                <span className="price-tag" style={{fontSize: '1.4rem'}}>
                                    {formatPrice(c.total)}
                                </span>
                            </div>

                            {c.error && (
                                <div className={styles.errorBox}>
                                    <AlertCircle size={14}/> {c.error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className={`btn-primary ${styles.submitBtn}`}
                                disabled={
                                    c.submitting ||
                                    c.slots.length === 0 ||
                                    (c.orderType === OrderType.DELIVERY && c.outOfRange)
                                }
                            >
                                {c.submitting
                                    ? 'Redirection...'
                                    : c.slots.length === 0
                                        ? 'Aucun créneau disponible'
                                        : `Payer ${formatPrice(c.total)}`
                                }
                            </button>

                            <p className={styles.recapNote}>
                                Paiement sécurisé via Stripe. Carte bancaire ou Bancontact.
                            </p>
                        </div>
                    </aside>
                </form>
            </div>

            {c.showPhoneModal && (
                <PhoneModal
                    onSuccess={c.handlePhoneModalSuccess}
                    onClose={c.handlePhoneModalClose}
                />
            )}
        </AppLayout>
    );
}

function Field({
                   label,
                   required,
                   children,
               }: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <label className={styles.field}>
            <span className={styles.fieldLabel}>
                {label} {required && <span className={styles.required}>*</span>}
            </span>
            {children}
        </label>
    );
}

function AddressFormFields({
                               value,
                               onChange,
                           }: {
    value: AddressForm;
    onChange: (v: AddressForm) => void;
}) {
    const update = (key: keyof AddressForm, v: string) =>
        onChange({...value, [key]: v});

    return (
        <div className={styles.addressForm}>
            <div className={styles.addressFormRow}>
                <Field label="Rue" required>
                    <input
                        type="text"
                        className={styles.input}
                        value={value.street}
                        onChange={(e) => update('street', e.target.value)}
                        required
                    />
                </Field>
                <Field label="Numéro" required>
                    <input
                        type="text"
                        className={styles.input}
                        value={value.number}
                        onChange={(e) => update('number', e.target.value)}
                        required
                    />
                </Field>
                <Field label="Boîte">
                    <input
                        type="text"
                        className={styles.input}
                        value={value.box}
                        onChange={(e) => update('box', e.target.value)}
                    />
                </Field>
            </div>
            <div className={styles.addressFormRow}>
                <Field label="Code postal" required>
                    <input
                        type="text"
                        className={styles.input}
                        value={value.postalCode}
                        onChange={(e) => update('postalCode', e.target.value)}
                        required
                    />
                </Field>
                <Field label="Ville" required>
                    <input
                        type="text"
                        className={styles.input}
                        value={value.city}
                        onChange={(e) => update('city', e.target.value)}
                        required
                    />
                </Field>
            </div>
            <Field label="Complément (digicode, étage, ...)">
                <input
                    type="text"
                    className={styles.input}
                    value={value.complement}
                    onChange={(e) => update('complement', e.target.value)}
                />
            </Field>
        </div>
    );
}
