import Room from '../../../components/Room'
const RoomPage = ({ params }: { params: { id: string } }) => {

    const { id } = params;
    return <Room roomId={id} />;
};

export default RoomPage;