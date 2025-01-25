import Room from '../../../components/Room'

const RoomPage = async ({ params }: {params : Promise<{ id: string }>}) => {
    const id = (await params).id;
    return <Room roomId={id} />;
}

export default RoomPage;
