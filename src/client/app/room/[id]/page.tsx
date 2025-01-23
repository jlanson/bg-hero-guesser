import Room from '../../../components/Room'


const RoomPage = async ({ params }: {params : Promise<{ slug: string }>}) => {
    const id = (await params).slug;
    return <Room roomId={id} />;
}

export default RoomPage;
